"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { DiagramGenerateRequest } from "@/lib/agent/types";
import { AgentChatPanel } from "@/components/agent/AgentChatPanel";
import { ApiKeyConnect } from "@/components/agent/ApiKeyConnect";
import { YamlEditor } from "@/components/agent/YamlEditor";
import { DiagramUpload } from "@/components/process/DiagramUpload";
import { ProcessFlowCanvas } from "@/components/process/ProcessFlowCanvas";
import { SourceDiagramPanel } from "@/components/process/SourceDiagramPanel";
import { ExternalLink } from "@/components/site/ExternalLink";
import { siteLinks } from "@/lib/site/links";
import {
  clearStoredAgentId,
  getStoredAgentId,
  setStoredAgentId,
} from "@/lib/agent/client-store";
import { parseProcessHmi } from "@/lib/process/parse";

interface DesignerAppProps {
  initialYaml: string;
  initialApiConnected: boolean;
  initialApiSource?: "cookie" | "env" | null;
  defaultSourceImage: string;
}

function ApiStatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-[var(--alarm-ok)]">
        API key connected
      </span>
    );
  }
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-[var(--alarm-warn)]">
      Preview only — connect key to generate
    </span>
  );
}

function parseSseEvents(buffer: string) {
  const events: Array<{ event: string; data: string }> = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const part of parts) {
    if (!part.trim()) continue;
    let event = "message";
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (data) events.push({ event, data });
  }
  return { events, rest };
}

export function DesignerApp({
  initialYaml,
  initialApiConnected,
  initialApiSource = null,
  defaultSourceImage,
}: DesignerAppProps) {
  const [yaml, setYaml] = useState(initialYaml);
  const [apiConnected, setApiConnected] = useState(initialApiConnected);
  const [sourceImage, setSourceImage] = useState<string | null>(defaultSourceImage);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleAuthError = useCallback((message: string) => {
    setApiConnected(false);
    setGenerateError(message);
  }, []);

  const parsed = useMemo(() => parseProcessHmi(yaml), [yaml]);

  const runGenerate = useCallback(
    async (request: DiagramGenerateRequest) => {
      if (!apiConnected || generating) return;
      setGenerating(true);
      setGenerateError(null);

      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: request.prompt,
            agentId: getStoredAgentId() ?? undefined,
            currentYaml: yaml,
            image: request.image,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          const message = payload.error ?? `Request failed (${response.status})`;
          if (response.status === 401) {
            handleAuthError(message);
          }
          throw new Error(message);
        }
        if (!response.body) throw new Error("No response stream");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = parseSseEvents(buffer);
          buffer = rest;

          for (const { event, data } of events) {
            const payload = JSON.parse(data) as Record<string, unknown>;
            if (event === "agentId" && typeof payload.agentId === "string") {
              setStoredAgentId(payload.agentId);
            }
            if (event === "yaml" && typeof payload.yaml === "string") {
              setYaml(payload.yaml);
            }
            if (event === "yaml_invalid") {
              setGenerateError(
                typeof payload.error === "string" ? payload.error : "Invalid YAML from agent",
              );
              if (typeof payload.yaml === "string") setYaml(payload.yaml);
            }
            if (event === "no_yaml") {
              setGenerateError(
                typeof payload.message === "string"
                  ? payload.message
                  : "Agent did not return YAML.",
              );
            }
            if (event === "error") {
              const message =
                typeof payload.message === "string" ? payload.message : "Agent error";
              setGenerateError(message);
              if (payload.authInvalid === true) {
                handleAuthError(message);
              }
              if (message.toLowerCase().includes("not found")) {
                clearStoredAgentId();
              }
            }
          }
        }
      } catch (err) {
        setGenerateError(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setGenerating(false);
      }
    },
    [apiConnected, generating, handleAuthError, yaml],
  );

  const handleGenerate = useCallback((request: DiagramGenerateRequest) => {
    void runGenerate(request);
  }, [runGenerate]);

  return (
    <div className="demo-workspace flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-base font-semibold text-[var(--foreground)]">P&ID → Process Flow HMI</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Upload a drawing or edit YAML — live SVG preview with simulated tags
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ApiStatusBadge connected={apiConnected} />
          <ExternalLink
            href={siteLinks.repo}
            className="hidden text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)] sm:inline"
          >
            GitHub
          </ExternalLink>
          <Link href="/" className="text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)]">
            About
          </Link>
        </div>
      </div>

      {generateError ? (
        <div className="mx-4 mt-2 shrink-0 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-[var(--alarm-critical)]">
          {generateError}
        </div>
      ) : null}

      <main className="demo-panels grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-12 lg:gap-4 lg:p-4">
        <section className="panel flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-3">
          <div className="shrink-0">
            <ApiKeyConnect
              initialConnected={initialApiConnected}
              initialSource={initialApiSource}
              onConnectionChange={setApiConnected}
            />
          </div>
          <div className="shrink-0">
            <DiagramUpload
              apiConnected={apiConnected}
              generating={generating}
              onPreviewUrl={setSourceImage}
              onGenerate={handleGenerate}
            />
          </div>
          <AgentChatPanel
            currentYaml={yaml}
            onYamlApplied={setYaml}
            apiConnected={apiConnected}
            onAuthError={handleAuthError}
          />
        </section>

        <section className="panel flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-4">
          <YamlEditor
            value={yaml}
            onChange={setYaml}
            error={parsed.ok ? null : parsed.error}
            title="process-hmi.yaml"
          />
        </section>

        <section className="panel flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-5">
          <h2 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            Live HMI
          </h2>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ProcessFlowCanvas config={parsed.ok ? parsed.config : null} />
          </div>
          <SourceDiagramPanel src={sourceImage} />
        </section>
      </main>
    </div>
  );
}

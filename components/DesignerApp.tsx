"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AgentChatPanel } from "@/components/agent/AgentChatPanel";
import { ApiKeyConnect } from "@/components/agent/ApiKeyConnect";
import { useGenerateHmi } from "@/components/agent/useGenerateHmi";
import { YamlEditor } from "@/components/agent/YamlEditor";
import { DiagramUpload } from "@/components/process/DiagramUpload";
import { ExpandableHmiPanel } from "@/components/process/ExpandableHmiPanel";
import { SourceDiagramPanel } from "@/components/process/SourceDiagramPanel";
import { ExternalLink } from "@/components/site/ExternalLink";
import { siteLinks } from "@/lib/site/links";
import { parseProcessHmi } from "@/lib/process/parse";
import type { ProcessHmiConfig } from "@/lib/process/schema";

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

function DesignerHeader({ apiConnected }: { apiConnected: boolean }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 sm:px-6">
      <div>
        <h1 className="text-base font-semibold text-[var(--foreground)]">P&ID → Process Flow HMI</h1>
        <p className="text-xs text-[var(--foreground-muted)]">
          Upload a drawing or refine via chat — live HMI above, YAML below
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
  );
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
  const [lastValidConfig, setLastValidConfig] = useState<ProcessHmiConfig | null>(() => {
    const initial = parseProcessHmi(initialYaml);
    return initial.ok ? initial.config : null;
  });

  const parsed = useMemo(() => parseProcessHmi(yaml), [yaml]);
  const displayConfig = parsed.ok ? parsed.config : lastValidConfig;

  const handleYamlChange = useCallback((nextYaml: string) => {
    setYaml(nextYaml);
    const result = parseProcessHmi(nextYaml);
    if (result.ok) setLastValidConfig(result.config);
  }, []);

  const generate = useGenerateHmi({
    apiConnected,
    yaml,
    onYamlChange: handleYamlChange,
    onAuthError: () => {
      setApiConnected(false);
    },
  });

  const handleAuthError = useCallback(
    (message: string) => {
      setApiConnected(false);
      generate.setGenerateError(message);
    },
    [generate],
  );

  return (
    <div className="demo-workspace flex min-h-0 flex-1 flex-col overflow-hidden">
      <DesignerHeader apiConnected={apiConnected} />

      {generate.generateError ? (
        <div className="mx-4 mt-2 shrink-0 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-[var(--alarm-critical)]">
          {generate.generateError}
        </div>
      ) : null}

      <main className="demo-panels grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_minmax(11rem,26vh)] lg:gap-4 lg:p-4">
        <section className="panel flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-4 lg:row-start-1">
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
              generating={generate.generating}
              generateProgress={generate.generateProgress}
              onProgressChange={generate.setGenerateProgress}
              onPreviewUrl={setSourceImage}
              onGenerate={generate.runGenerate}
            />
          </div>
          <AgentChatPanel
            currentYaml={yaml}
            onYamlApplied={handleYamlChange}
            apiConnected={apiConnected}
            onAuthError={handleAuthError}
          />
        </section>

        <section className="panel flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-8 lg:row-start-1">
          <ExpandableHmiPanel
            config={displayConfig}
            sourceImage={<SourceDiagramPanel src={sourceImage} />}
          />
        </section>

        <section className="panel flex min-h-0 flex-col overflow-hidden p-4 lg:col-span-12 lg:row-start-2">
          <YamlEditor
            value={yaml}
            onChange={handleYamlChange}
            error={parsed.ok ? null : parsed.error}
            title="process-hmi.yaml"
          />
        </section>
      </main>
    </div>
  );
}

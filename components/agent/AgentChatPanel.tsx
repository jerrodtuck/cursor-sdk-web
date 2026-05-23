"use client";

import { useCallback, useRef, useState } from "react";
import {
  clearStoredAgentId,
  getStoredAgentId,
  setStoredAgentId,
} from "@/lib/agent/client-store";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentChatPanelProps {
  currentYaml: string;
  onYamlApplied: (yaml: string) => void;
  apiConnected: boolean;
  onAuthError?: (message: string) => void;
}

function parseSseEvents(buffer: string): { events: Array<{ event: string; data: string }>; rest: string } {
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

function displayAssistantContent(content: string, streaming: boolean): string {
  const hasYamlBlock = content.includes("```yaml") || content.includes("```yml");
  const looksLikeYaml = /^\s*diagram:\s*$/m.test(content);

  if (hasYamlBlock || looksLikeYaml) {
    return streaming
      ? "Generating updated process-hmi.yaml…"
      : "Updated process-hmi.yaml — see the editor and live preview.";
  }

  return content;
}

export function AgentChatPanel({
  currentYaml,
  onYamlApplied,
  apiConnected,
  onAuthError,
}: AgentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastYaml, setLastYaml] = useState<string | null>(null);
  const assistantBufferRef = useRef("");

  const sendPrompt = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || streaming || !apiConnected) return;

    setInput("");
    setError(null);
    setStreaming(true);
    assistantBufferRef.current = "";

    setMessages((prev) => [...prev, { role: "user", content: prompt }, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          agentId: getStoredAgentId() ?? undefined,
          currentYaml,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        const message = payload.error ?? `Request failed (${response.status})`;
        if (response.status === 401) {
          onAuthError?.(message);
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

          if (event === "text_delta" && typeof payload.text === "string") {
            assistantBufferRef.current += payload.text;
            const snapshot = assistantBufferRef.current;
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, content: snapshot };
              }
              return next;
            });
          }

          if (event === "yaml" && typeof payload.yaml === "string") {
            setLastYaml(payload.yaml);
            onYamlApplied(payload.yaml);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: "Updated process-hmi.yaml — see the editor and live preview.",
                };
              }
              return next;
            });
          }

          if (event === "yaml_invalid") {
            setError(
              typeof payload.error === "string"
                ? `Agent YAML invalid: ${payload.error}`
                : "Agent returned invalid YAML",
            );
            if (typeof payload.yaml === "string") setLastYaml(payload.yaml);
          }

          if (event === "no_yaml") {
            setError(
              typeof payload.message === "string"
                ? payload.message
                : "Agent did not return updated YAML.",
            );
          }

          if (event === "error") {
            const message =
              typeof payload.message === "string" ? payload.message : "Agent error";
            setError(message);
            if (payload.authInvalid === true) {
              onAuthError?.(message);
            }
            if (message.toLowerCase().includes("not found")) {
              clearStoredAgentId();
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach agent");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }, [apiConnected, currentYaml, input, onAuthError, onYamlApplied, streaming]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
          Chat
        </h2>
        <button
          type="button"
          onClick={() => {
            clearStoredAgentId();
            setMessages([]);
            setError(null);
            setLastYaml(null);
          }}
          className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          New session
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-2">
        {messages.length === 0 ? (
          <p className="text-xs text-[var(--foreground-muted)]">
            Refine via chat: &quot;Move the boiler left — return the complete process-hmi.yaml&quot;
          </p>
        ) : null}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-md p-2 text-xs ${
              message.role === "user"
                ? "bg-[var(--accent-muted)] text-[var(--foreground)]"
                : "bg-[var(--surface)] whitespace-pre-wrap text-[var(--foreground)]"
            }`}
          >
            <div className="mb-1 text-[10px] uppercase tracking-wide text-[var(--foreground-muted)]">
              {message.role}
            </div>
            {message.role === "assistant"
              ? displayAssistantContent(
                  message.content,
                  streaming && index === messages.length - 1,
                )
              : message.content}
            {!message.content &&
            streaming &&
            message.role === "assistant" &&
            index === messages.length - 1
              ? "…"
              : ""}
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-2 shrink-0 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-[var(--alarm-critical)]">
          {error}
        </p>
      ) : null}

      {lastYaml && error ? (
        <button
          type="button"
          onClick={() => onYamlApplied(lastYaml)}
          className="mt-2 shrink-0 rounded-md border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground-muted)] hover:bg-[var(--surface-raised)]"
        >
          Apply YAML anyway
        </button>
      ) : null}

      <div className="mt-2 flex shrink-0 gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendPrompt();
            }
          }}
          disabled={!apiConnected || streaming}
          placeholder={
            apiConnected
              ? "Refine the HMI config..."
              : "Connect your Cursor API key above to use chat"
          }
          rows={2}
          className="min-h-[56px] flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void sendPrompt()}
          disabled={!apiConnected || streaming || !input.trim()}
          className="self-end rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {streaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

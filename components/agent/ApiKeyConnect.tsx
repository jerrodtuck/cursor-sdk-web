"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "@/components/site/ExternalLink";
import { NO_API_KEY_MESSAGE } from "@/lib/agent/api-key-messages";
import { clearStoredAgentId } from "@/lib/agent/client-store";
import { siteLinks } from "@/lib/site/links";

type ApiKeySource = "cookie" | "env" | null;

interface ApiKeyConnectProps {
  initialConnected: boolean;
  initialSource?: ApiKeySource;
  onConnectionChange: (connected: boolean) => void;
}

interface ConnectStatus {
  connected: boolean;
  source: ApiKeySource;
  error?: string;
}

export function ApiKeyConnect({
  initialConnected,
  initialSource = null,
  onConnectionChange,
}: ApiKeyConnectProps) {
  const [connected, setConnected] = useState(initialConnected);
  const [source, setSource] = useState<ApiKeySource>(initialSource);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncStatus = useCallback(
    (status: ConnectStatus) => {
      setConnected(status.connected);
      setSource(status.source);
      onConnectionChange(status.connected);
      if (status.error) {
        setError(status.error);
      }
    },
    [onConnectionChange],
  );

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/connect", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ConnectStatus;
      })
      .then((status) => {
        if (cancelled || !status) return;
        syncStatus(status);
      })
      .catch(() => {
        // Keep SSR-provided state if the status check fails.
      });

    return () => {
      cancelled = true;
    };
  }, [syncStatus]);

  const connect = useCallback(async () => {
    const apiKey = apiKeyInput.trim();
    if (!apiKey || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to connect");
      }

      setApiKeyInput("");
      syncStatus({ connected: true, source: "cookie" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  }, [apiKeyInput, loading, syncStatus]);

  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch("/api/connect", { method: "DELETE", credentials: "same-origin" });
      clearStoredAgentId();
      syncStatus({ connected: false, source: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  }, [syncStatus]);

  if (connected) {
    return (
      <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--alarm-ok)]">API key connected for this session</p>
          {source === "cookie" ? (
            <button
              type="button"
              onClick={() => void disconnect()}
              disabled={loading}
              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              Disconnect
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-[var(--foreground-muted)]">
          {source === "env"
            ? "Using CURSOR_API_KEY from .env.local on the server. Restart the dev server after changing it."
            : "Stored in an HttpOnly cookie (not accessible to JavaScript). Used server-side to call Cursor with your account."}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-medium text-[var(--foreground)]">Connect your Cursor API key</p>
      <p className="mt-1 text-[10px] leading-relaxed text-[var(--foreground-muted)]">
        {NO_API_KEY_MESSAGE} Get a key from{" "}
        <ExternalLink href={siteLinks.apiKey} className="text-[var(--accent)] hover:underline">
          Cursor Integrations
        </ExternalLink>
        .
      </p>
      <div className="mt-2 flex gap-2">
        <input
          type="password"
          value={apiKeyInput}
          onChange={(event) => setApiKeyInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void connect();
            }
          }}
          placeholder="cursor_..."
          autoComplete="off"
          disabled={loading}
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 font-mono text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void connect()}
          disabled={loading || !apiKeyInput.trim()}
          className="shrink-0 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : "Connect"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-[var(--alarm-critical)]">{error}</p>
      ) : null}
    </div>
  );
}

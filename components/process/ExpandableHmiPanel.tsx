"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProcessFlowCanvas } from "@/components/process/ProcessFlowCanvas";
import type { ProcessHmiConfig } from "@/lib/process/schema";

interface ExpandableHmiPanelProps {
  config: ProcessHmiConfig | null;
  sourceImage?: React.ReactNode;
}

function ExpandIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  );
}

export function ExpandableHmiPanel({ config, sourceImage }: ExpandableHmiPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const closeExpanded = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
    setExpanded(false);
  }, []);

  const toggleNativeFullscreen = useCallback(async () => {
    const el = overlayRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await el.requestFullscreen();
  }, []);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          closeExpanded();
        }
      }
    };

    const onFullscreenChange = () => {
      setNativeFullscreen(document.fullscreenElement === overlayRef.current);
      if (!document.fullscreenElement && !overlayRef.current?.isConnected) {
        setExpanded(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [closeExpanded, expanded]);

  const title = config?.diagram.title ?? "Live HMI";

  const expandButton = (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      disabled={!config}
      title="Expand HMI"
      className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--foreground-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ExpandIcon />
      Expand
    </button>
  );

  const overlayControls = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void toggleNativeFullscreen()}
        title={nativeFullscreen ? "Exit browser fullscreen" : "Enter browser fullscreen"}
        className="inline-flex items-center gap-1 rounded-md border border-[var(--canvas-border)] px-2 py-1 text-[10px] font-medium text-[var(--canvas-foreground-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--canvas-foreground)]"
      >
        <FullscreenIcon />
        {nativeFullscreen ? "Exit fullscreen" : "Fullscreen"}
      </button>
      <button
        type="button"
        onClick={closeExpanded}
        title="Close expanded view"
        className="inline-flex items-center gap-1 rounded-md border border-[var(--canvas-border)] px-2 py-1 text-[10px] font-medium text-[var(--canvas-foreground-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--canvas-foreground)]"
      >
        <CollapseIcon />
        Close
      </button>
    </div>
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            Live HMI
          </h2>
          {expandButton}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ProcessFlowCanvas config={config} />
        </div>
        {sourceImage}
      </div>

      {expanded ? (
        <div
          ref={overlayRef}
          className="hmi-canvas-shell fixed inset-0 z-50 flex flex-col bg-[var(--canvas-background)]"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — expanded HMI view`}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--canvas-border)] px-4 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--canvas-foreground)]">{title}</p>
              <p className="text-[10px] text-[var(--canvas-foreground-muted)]">
                Scroll to zoom · drag to pan · Esc to close
              </p>
            </div>
            {overlayControls}
          </header>
          <div className="min-h-0 flex-1 overflow-hidden p-3">
            <ProcessFlowCanvas key="expanded" config={config} />
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useRef } from "react";
import type { DiagramGenerateRequest } from "@/lib/agent/types";
import { progressLabel, type GenerateProgress } from "@/lib/agent/generate-progress";
import { UploadProgress } from "@/components/process/UploadProgress";
import { useDiagramUpload } from "@/components/process/useDiagramUpload";

import { UPLOAD_ACCEPT } from "@/lib/process/upload-constants";

interface DiagramUploadProps {
  apiConnected: boolean;
  onPreviewUrl: (url: string | null) => void;
  onGenerate: (request: DiagramGenerateRequest) => Promise<void>;
  onProgressChange: (progress: GenerateProgress) => void;
  generateProgress: GenerateProgress;
  generating: boolean;
}

function UploadDropzone({
  disabled,
  dragOver,
  busy,
  apiConnected,
  onBrowse,
  onKeyDown,
  onDragOver,
  onDragLeave,
  onDrop,
  idleProgress,
}: {
  disabled: boolean;
  dragOver: boolean;
  busy: boolean;
  apiConnected: boolean;
  onBrowse: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  idleProgress: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={onBrowse}
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors ${
        disabled ? "cursor-not-allowed opacity-50" : "hover:border-[var(--accent)]/50 hover:bg-[var(--accent-muted)]"
      } ${dragOver ? "border-[var(--accent)] bg-[var(--accent-muted)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
    >
      {busy && idleProgress ? (
        <>
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="mt-2 text-xs font-medium text-[var(--foreground)]">Preparing file…</p>
        </>
      ) : (
        <>
          <svg
            aria-hidden
            className="h-6 w-6 text-[var(--foreground-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mt-2 text-xs font-medium text-[var(--foreground)]">
            {apiConnected ? "Click or drag a drawing here" : "Connect API key to upload"}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--foreground-muted)]">PNG · JPEG · WebP · PDF</p>
        </>
      )}
    </div>
  );
}

function PdfPageControls({
  pdfPages,
  pdfPage,
  busy,
  onPageChange,
  onRegenerate,
}: {
  pdfPages: number;
  pdfPage: number;
  busy: boolean;
  onPageChange: (page: number) => void;
  onRegenerate: () => void;
}) {
  if (pdfPages <= 1) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <label className="text-xs text-[var(--foreground-muted)]">
        PDF page
        <select
          value={pdfPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          className="ml-1 rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-xs"
        >
          {Array.from({ length: pdfPages }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={onRegenerate}
        className="rounded bg-[var(--surface-raised)] px-2 py-1 text-xs hover:bg-[var(--border)] disabled:opacity-50"
      >
        Regenerate from page
      </button>
    </div>
  );
}

export function DiagramUpload({
  apiConnected,
  onPreviewUrl,
  onGenerate,
  onProgressChange,
  generateProgress,
  generating,
}: DiagramUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useDiagramUpload({
    apiConnected,
    generating,
    onPreviewUrl,
    onGenerate,
    onProgressChange,
  });

  const disabled = !apiConnected || upload.busy;
  const showProgress = generateProgress.phase !== "idle" || upload.busy;

  return (
    <div className="mb-3 rounded-md border border-[var(--border)] bg-[var(--background)]/60 p-3">
      <p className="text-xs font-medium text-[var(--foreground)]">Upload P&ID / PFD</p>
      <p className="mt-1 text-[10px] text-[var(--foreground-muted)]">
        PNG, JPEG, WebP, or PDF — generates process-hmi.yaml via Cursor agent
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload.processFile(file);
          e.target.value = "";
        }}
        className="sr-only"
      />

      <UploadDropzone
        disabled={disabled}
        dragOver={upload.dragOver}
        busy={upload.busy}
        apiConnected={apiConnected}
        idleProgress={generateProgress.phase === "idle"}
        onBrowse={() => {
          if (!disabled) fileInputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) upload.setDragOver(true);
        }}
        onDragLeave={() => upload.setDragOver(false)}
        onDrop={(event) => {
          if (!disabled) {
            event.preventDefault();
            upload.setDragOver(false);
            const file = event.dataTransfer.files[0];
            if (file) void upload.processFile(file);
          }
        }}
      />

      {showProgress ? (
        <UploadProgress
          progress={
            generateProgress.phase !== "idle"
              ? generateProgress
              : {
                  phase: upload.processing ? "reading" : "uploading",
                  label: upload.processing
                    ? "Preparing file…"
                    : progressLabel("uploading", upload.selectedName),
                  fileName: upload.selectedName,
                }
          }
          isPdf={upload.isPdfUpload}
        />
      ) : null}

      {upload.selectedName && !upload.busy && generateProgress.phase === "idle" ? (
        <p className="mt-2 truncate text-[10px] text-[var(--foreground-muted)]">
          Last upload: {upload.selectedName}
        </p>
      ) : null}

      <PdfPageControls
        pdfPages={upload.pdfPages}
        pdfPage={upload.pdfPage}
        busy={upload.busy}
        onPageChange={upload.setPdfPage}
        onRegenerate={() => void upload.rasterizeSelectedPage()}
      />

      {upload.error ? <p className="mt-2 text-xs text-[var(--alarm-critical)]">{upload.error}</p> : null}
    </div>
  );
}

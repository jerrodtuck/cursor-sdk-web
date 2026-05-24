"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentImagePayload, DiagramGenerateRequest } from "@/lib/agent/types";
import {
  IDLE_PROGRESS,
  type GenerateProgress,
  progressLabel,
} from "@/lib/agent/generate-progress";
import { inferMimeType, isSupportedUpload } from "@/lib/process/infer-mime-type";
import { UploadProgress } from "@/components/process/UploadProgress";

const GENERATE_PROMPT =
  "Convert this P&ID or PFD into a complete process-hmi.yaml. Include all labeled equipment, flow edges, normalized positions matching the drawing layout, and inferred ISA instrument tags. Spread equipment to avoid overlap — minimum 0.11 horizontal and 0.13 vertical spacing between centers. Use smaller sizes for pumps, valves, and heat exchangers on dense diagrams.";

const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf,.png,.jpg,.jpeg,.webp,.pdf";

interface DiagramUploadProps {
  apiConnected: boolean;
  onPreviewUrl: (url: string | null) => void;
  onGenerate: (request: DiagramGenerateRequest) => Promise<void>;
  onProgressChange: (progress: GenerateProgress) => void;
  generateProgress: GenerateProgress;
  generating: boolean;
}

async function readFileAsBase64(file: File, mimeType: string): Promise<AgentImagePayload> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType,
  };
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
  const previewUrlRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isPdfUpload, setIsPdfUpload] = useState(false);

  const setPreviewUrl = useCallback(
    (url: string | null) => {
      if (previewUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      previewUrlRef.current = url;
      onPreviewUrl(url);
    },
    [onPreviewUrl],
  );

  const reportProgress = useCallback(
    (phase: GenerateProgress["phase"], fileName: string, detail?: string) => {
      onProgressChange({
        phase,
        label: progressLabel(phase, fileName),
        fileName,
        detail: detail ?? null,
      });
    },
    [onProgressChange],
  );

  const handleImageFile = useCallback(
    async (file: File, mimeType: string) => {
      setError(null);
      setPdfPages(0);
      setPendingFile(null);
      setIsPdfUpload(false);
      setSelectedName(file.name);
      reportProgress("reading", file.name, "Encoding image for the agent…");
      setPreviewUrl(URL.createObjectURL(file));
      const image = await readFileAsBase64(file, mimeType);
      await onGenerate({ prompt: GENERATE_PROMPT, image });
    },
    [onGenerate, reportProgress, setPreviewUrl],
  );

  const handlePdfFile = useCallback(
    async (file: File) => {
      setError(null);
      setPendingFile(file);
      setIsPdfUpload(true);
      setSelectedName(file.name);
      reportProgress("rasterizing", file.name, "Loading PDF and rendering page 1…");
      const { getPdfPageCount, rasterizePdfPage } = await import("@/lib/process/pdf-rasterize");
      const count = await getPdfPageCount(file);
      setPdfPages(count);
      setPdfPage(1);
      const { dataUrl, image } = await rasterizePdfPage(file, 1);
      setPreviewUrl(dataUrl);
      await onGenerate({ prompt: GENERATE_PROMPT, image });
    },
    [onGenerate, reportProgress, setPreviewUrl],
  );

  const processFile = useCallback(
    async (file: File) => {
      if (!apiConnected || generating || processing) return;

      const mimeType = inferMimeType(file);
      if (!mimeType || !isSupportedUpload(mimeType)) {
        setError("Unsupported file type. Use PNG, JPEG, WebP, or PDF.");
        return;
      }

      setProcessing(true);
      setError(null);
      onProgressChange(IDLE_PROGRESS);

      try {
        if (mimeType === "application/pdf") {
          await handlePdfFile(file);
        } else {
          await handleImageFile(file, mimeType);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to process file";
        setError(message);
        onProgressChange({
          phase: "error",
          label: progressLabel("error", file.name),
          fileName: file.name,
          detail: message,
        });
      } finally {
        setProcessing(false);
      }
    },
    [apiConnected, generating, handleImageFile, handlePdfFile, onProgressChange, processing],
  );

  const rasterizeSelectedPage = useCallback(async () => {
    if (!pendingFile) return;
    setError(null);
    setProcessing(true);
    try {
      reportProgress("rasterizing", pendingFile.name, `Rendering PDF page ${pdfPage}…`);
      const { rasterizePdfPage } = await import("@/lib/process/pdf-rasterize");
      const { dataUrl, image } = await rasterizePdfPage(pendingFile, pdfPage);
      setPreviewUrl(dataUrl);
      await onGenerate({ prompt: GENERATE_PROMPT, image });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to rasterize PDF page";
      setError(message);
      onProgressChange({
        phase: "error",
        label: progressLabel("error", pendingFile.name),
        fileName: pendingFile.name,
        detail: message,
      });
    } finally {
      setProcessing(false);
    }
  }, [pendingFile, pdfPage, onGenerate, onProgressChange, reportProgress, setPreviewUrl]);

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) await processFile(file);
      event.target.value = "";
    },
    [processFile],
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
      if (file) await processFile(file);
    },
    [processFile],
  );

  const busy = generating || processing;
  const disabled = !apiConnected || busy;
  const showProgress = generateProgress.phase !== "idle" || busy;

  return (
    <div className="mb-3 rounded-md border border-[var(--border)] bg-[var(--background)]/60 p-3">
      <p className="text-xs font-medium text-[var(--foreground)]">Upload P&ID / PFD</p>
      <p className="mt-1 text-[10px] text-[var(--foreground-muted)]">
        PNG, JPEG, WebP, or PDF — generates process-hmi.yaml via Cursor agent
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        disabled={disabled}
        onChange={(e) => void onFileChange(e)}
        className="sr-only"
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => {
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
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          if (!disabled) void onDrop(event);
        }}
        className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "hover:border-[var(--accent)]/50 hover:bg-[var(--accent-muted)]"
        } ${dragOver ? "border-[var(--accent)] bg-[var(--accent-muted)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
      >
        {busy && generateProgress.phase === "idle" ? (
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

      {showProgress ? (
        <UploadProgress
          progress={
            generateProgress.phase !== "idle"
              ? generateProgress
              : {
                  phase: processing ? "reading" : "uploading",
                  label: processing ? "Preparing file…" : progressLabel("uploading", selectedName),
                  fileName: selectedName,
                }
          }
          isPdf={isPdfUpload}
        />
      ) : null}

      {selectedName && !busy && generateProgress.phase === "idle" ? (
        <p className="mt-2 truncate text-[10px] text-[var(--foreground-muted)]">Last upload: {selectedName}</p>
      ) : null}

      {pdfPages > 1 ? (
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-[var(--foreground-muted)]">
            PDF page
            <select
              value={pdfPage}
              onChange={(e) => setPdfPage(Number(e.target.value))}
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
            onClick={() => void rasterizeSelectedPage()}
            className="rounded bg-[var(--surface-raised)] px-2 py-1 text-xs hover:bg-[var(--border)] disabled:opacity-50"
          >
            Regenerate from page
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-[var(--alarm-critical)]">{error}</p> : null}
    </div>
  );
}

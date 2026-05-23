"use client";

import { useCallback, useState } from "react";
import type { AgentImagePayload, DiagramGenerateRequest } from "@/lib/agent/types";

const GENERATE_PROMPT =
  "Convert this P&ID or PFD into a complete process-hmi.yaml. Include all labeled equipment, flow edges, normalized positions matching the drawing layout, and inferred ISA instrument tags.";

interface DiagramUploadProps {
  apiConnected: boolean;
  onPreviewUrl: (url: string | null) => void;
  onGenerate: (request: DiagramGenerateRequest) => void;
  generating: boolean;
}

async function readFileAsBase64(file: File): Promise<AgentImagePayload> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: file.type || "application/octet-stream",
  };
}

export function DiagramUpload({
  apiConnected,
  onPreviewUrl,
  onGenerate,
  generating,
}: DiagramUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleImageFile = useCallback(
    async (file: File) => {
      setError(null);
      setPdfPages(0);
      setPendingFile(null);
      onPreviewUrl(URL.createObjectURL(file));
      const image = await readFileAsBase64(file);
      onGenerate({ prompt: GENERATE_PROMPT, image });
    },
    [onGenerate, onPreviewUrl],
  );

  const handlePdfFile = useCallback(
    async (file: File) => {
      setError(null);
      setPendingFile(file);
      try {
        const { getPdfPageCount, rasterizePdfPage } = await import("@/lib/process/pdf-rasterize");
        const count = await getPdfPageCount(file);
        setPdfPages(count);
        setPdfPage(1);
        const { dataUrl, image } = await rasterizePdfPage(file, 1);
        onPreviewUrl(dataUrl);
        onGenerate({ prompt: GENERATE_PROMPT, image });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read PDF");
      }
    },
    [onGenerate, onPreviewUrl],
  );

  const rasterizeSelectedPage = useCallback(async () => {
    if (!pendingFile) return;
    setError(null);
    try {
      const { rasterizePdfPage } = await import("@/lib/process/pdf-rasterize");
      const { dataUrl, image } = await rasterizePdfPage(pendingFile, pdfPage);
      onPreviewUrl(dataUrl);
      onGenerate({ prompt: GENERATE_PROMPT, image });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rasterize PDF page");
    }
  }, [pendingFile, pdfPage, onGenerate, onPreviewUrl]);

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.type === "application/pdf") {
        await handlePdfFile(file);
      } else if (file.type.startsWith("image/")) {
        await handleImageFile(file);
      } else {
        setError("Unsupported file type. Use PNG, JPEG, WebP, or PDF.");
      }
      event.target.value = "";
    },
    [handleImageFile, handlePdfFile],
  );

  return (
    <div className="mb-3 rounded-md border border-[var(--border)] bg-[var(--background)]/60 p-3">
      <p className="text-xs font-medium text-[var(--foreground)]">Upload P&ID / PFD</p>
      <p className="mt-1 text-[10px] text-[var(--foreground-muted)]">
        PNG, JPEG, WebP, or PDF — generates process-hmi.yaml via Cursor agent
      </p>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        disabled={!apiConnected || generating}
        onChange={(e) => void onFileChange(e)}
        className="mt-2 block w-full text-xs text-[var(--foreground-muted)] file:mr-2 file:rounded file:border-0 file:bg-[var(--accent)] file:px-2 file:py-1 file:text-xs file:font-medium file:text-white disabled:opacity-50"
      />
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
            disabled={generating}
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

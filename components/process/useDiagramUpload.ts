"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiagramGenerateRequest } from "@/lib/agent/types";
import { IDLE_PROGRESS, type GenerateProgress } from "@/lib/agent/generate-progress";
import {
  buildUploadErrorProgress,
  buildUploadProgress,
  encodeImageFile,
  loadPdfPageCount,
  rasterizePdfUpload,
} from "@/lib/process/upload-actions";
import { inferMimeType, isSupportedUpload } from "@/lib/process/infer-mime-type";

interface UseDiagramUploadOptions {
  apiConnected: boolean;
  generating: boolean;
  onPreviewUrl: (url: string | null) => void;
  onGenerate: (request: DiagramGenerateRequest) => Promise<void>;
  onProgressChange: (progress: GenerateProgress) => void;
}

export function useDiagramUpload({
  apiConnected,
  generating,
  onPreviewUrl,
  onGenerate,
  onProgressChange,
}: UseDiagramUploadOptions) {
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
      if (previewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = url;
      onPreviewUrl(url);
    },
    [onPreviewUrl],
  );

  useEffect(() => {
    return () => {
      if (previewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const reportProgress = useCallback(
    (phase: GenerateProgress["phase"], fileName: string, detail?: string) => {
      onProgressChange(buildUploadProgress(phase, fileName, detail));
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
      await onGenerate(await encodeImageFile(file, mimeType));
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
      setPdfPages(await loadPdfPageCount(file));
      setPdfPage(1);
      const { dataUrl, request } = await rasterizePdfUpload(file, 1);
      setPreviewUrl(dataUrl);
      await onGenerate(request);
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
        if (mimeType === "application/pdf") await handlePdfFile(file);
        else await handleImageFile(file, mimeType);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to process file";
        setError(message);
        onProgressChange(buildUploadErrorProgress(file.name, message));
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
      const { dataUrl, request } = await rasterizePdfUpload(pendingFile, pdfPage);
      setPreviewUrl(dataUrl);
      await onGenerate(request);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to rasterize PDF page";
      setError(message);
      onProgressChange(buildUploadErrorProgress(pendingFile.name, message));
    } finally {
      setProcessing(false);
    }
  }, [pendingFile, pdfPage, onGenerate, onProgressChange, reportProgress, setPreviewUrl]);

  return {
    error,
    pdfPages,
    pdfPage,
    setPdfPage,
    dragOver,
    setDragOver,
    processing,
    selectedName,
    isPdfUpload,
    busy: generating || processing,
    processFile,
    rasterizeSelectedPage,
  };
}

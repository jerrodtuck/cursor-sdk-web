import type { DiagramGenerateRequest } from "@/lib/agent/types";
import { readFileAsBase64 } from "@/lib/agent/read-file-as-base64";
import { GENERATE_PROMPT } from "@/lib/process/upload-constants";
import {
  type GenerateProgress,
  progressLabel,
} from "@/lib/agent/generate-progress";

export async function encodeImageFile(file: File, mimeType: string): Promise<DiagramGenerateRequest> {
  const image = await readFileAsBase64(file, mimeType);
  return { prompt: GENERATE_PROMPT, image };
}

export async function rasterizePdfUpload(file: File, page: number) {
  const { rasterizePdfPage } = await import("@/lib/process/pdf-rasterize");
  const { dataUrl, image } = await rasterizePdfPage(file, page);
  return { dataUrl, request: { prompt: GENERATE_PROMPT, image } as DiagramGenerateRequest };
}

export async function loadPdfPageCount(file: File): Promise<number> {
  const { getPdfPageCount } = await import("@/lib/process/pdf-rasterize");
  return getPdfPageCount(file);
}

export function buildUploadErrorProgress(fileName: string, message: string): GenerateProgress {
  return {
    phase: "error",
    label: progressLabel("error", fileName),
    fileName,
    detail: message,
  };
}

export function buildUploadProgress(
  phase: GenerateProgress["phase"],
  fileName: string,
  detail?: string,
): GenerateProgress {
  return {
    phase,
    label: progressLabel(phase, fileName),
    fileName,
    detail: detail ?? null,
  };
}

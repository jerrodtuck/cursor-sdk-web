"use client";

import type { AgentImagePayload } from "@/lib/agent/types";

type PdfJsModule = typeof import("pdfjs-dist");

let pdfjsReady: Promise<PdfJsModule> | null = null;

async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsReady) {
    pdfjsReady = import("pdfjs-dist").then(async (pdfjs) => {
      const workerModule = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
      return pdfjs;
    });
  }
  return pdfjsReady;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  return doc.numPages;
}

export async function rasterizePdfPage(
  file: File,
  pageNumber: number,
): Promise<{ dataUrl: string; image: AgentImagePayload }> {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Failed to encode PDF page");

  return {
    dataUrl,
    image: { data: base64, mimeType: "image/png" },
  };
}

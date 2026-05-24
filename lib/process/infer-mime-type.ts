const EXT_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export function inferMimeType(file: File): string | null {
  if (file.type) return file.type;

  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext) return null;
  return EXT_MIME[ext] ?? null;
}

export function isSupportedUpload(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

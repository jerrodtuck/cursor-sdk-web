import type { AgentImagePayload } from "@/lib/agent/types";

const CHUNK_SIZE = 0x8000;

export async function readFileAsBase64(file: File, mimeType: string): Promise<AgentImagePayload> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return { data: btoa(binary), mimeType };
}

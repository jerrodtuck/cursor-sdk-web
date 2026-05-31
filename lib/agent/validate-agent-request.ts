import { z } from "zod";
import type { AgentImagePayload } from "./types";

export const MAX_PROMPT_LENGTH = 10_000;
export const MAX_YAML_LENGTH = 500_000;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_AGENT_ID_LENGTH = 128;

const SUPPORTED_IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"] as const;

const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;

const imageSchema = z.object({
  data: z.string().min(1).max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3)),
  mimeType: z.enum(SUPPORTED_IMAGE_MIME),
});

export const agentRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(MAX_PROMPT_LENGTH),
  agentId: z.string().min(1).max(MAX_AGENT_ID_LENGTH).optional(),
  currentYaml: z.string().max(MAX_YAML_LENGTH).optional(),
  image: imageSchema.optional(),
});

export type AgentRequestBody = z.infer<typeof agentRequestSchema>;

export type ValidateAgentRequestResult =
  | { ok: true; data: AgentRequestBody }
  | { ok: false; status: 400 | 413; error: string };

function estimateDecodedBase64Length(data: string): number {
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return Math.floor((data.length * 3) / 4) - padding;
}

function validateImagePayload(image: AgentImagePayload): ValidateAgentRequestResult | null {
  if (!base64Pattern.test(image.data)) {
    return { ok: false, status: 400, error: "image.data must be valid base64" };
  }

  const decodedBytes = estimateDecodedBase64Length(image.data);
  if (decodedBytes > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `image exceeds maximum size of ${MAX_IMAGE_BYTES} bytes`,
    };
  }

  return null;
}

export function validateAgentRequest(body: unknown): ValidateAgentRequestResult {
  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? issue.path.join(".") : "body";
    return { ok: false, status: 400, error: `${path}: ${issue?.message ?? "Invalid request"}` };
  }

  if (parsed.data.image) {
    const imageError = validateImagePayload(parsed.data.image);
    if (imageError) return imageError;
  }

  return { ok: true, data: parsed.data };
}

export async function parseValidatedAgentRequest(
  request: Request,
): Promise<ValidateAgentRequestResult> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }

  return validateAgentRequest(body);
}

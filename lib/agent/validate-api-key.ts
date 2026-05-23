import { Cursor, CursorAgentError } from "@cursor/sdk";
import { INVALID_API_KEY_MESSAGE } from "@/lib/agent/api-key-messages";

export type ApiKeyValidation =
  | { ok: true }
  | { ok: false; message: string };

export async function validateApiKey(apiKey: string): Promise<ApiKeyValidation> {
  try {
    await Cursor.me({ apiKey });
    return { ok: true };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      return { ok: false, message: INVALID_API_KEY_MESSAGE };
    }
    return { ok: false, message: "Could not verify API key. Try again in a moment." };
  }
}

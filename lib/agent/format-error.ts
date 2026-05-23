import { CursorAgentError } from "@cursor/sdk";
import { AGENT_START_FAILED_MESSAGE } from "@/lib/agent/api-key-messages";
import { validateApiKey } from "@/lib/agent/validate-api-key";

export function formatAgentError(err: unknown): { message: string; retryable: boolean } {
  if (err instanceof CursorAgentError) {
    const message =
      err.message && err.message !== "Error" ? err.message : AGENT_START_FAILED_MESSAGE;
    return { message, retryable: err.isRetryable };
  }

  if (err instanceof Error) {
    return { message: err.message || "Unknown error", retryable: false };
  }

  return { message: "Unknown error", retryable: false };
}

/** If agent startup failed, distinguish invalid key from CLI/runtime issues. */
export async function formatAgentStartError(
  err: unknown,
  apiKey: string,
): Promise<{ message: string; retryable: boolean; authInvalid?: boolean }> {
  const validation = await validateApiKey(apiKey);
  if (!validation.ok) {
    return { message: validation.message, retryable: false, authInvalid: true };
  }

  return formatAgentError(err);
}

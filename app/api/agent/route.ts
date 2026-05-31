import { NO_API_KEY_MESSAGE } from "@/lib/agent/api-key-messages";
import { getApiKeyFromCookies } from "@/lib/agent/api-key-cookie";
import { createAgentSseResponse, streamAgentRun } from "@/lib/agent/stream-agent-run";
import { validateApiKey } from "@/lib/agent/validate-api-key";
import { parseValidatedAgentRequest } from "@/lib/agent/validate-agent-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  const apiKey = await getApiKeyFromCookies();
  if (!apiKey) {
    return Response.json({ error: NO_API_KEY_MESSAGE }, { status: 401 });
  }

  const validation = await validateApiKey(apiKey);
  if (!validation.ok) {
    return Response.json({ error: validation.message }, { status: 401 });
  }

  const parsed = await parseValidatedAgentRequest(request);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: parsed.status });
  }

  return createAgentSseResponse((send) => streamAgentRun(apiKey, parsed.data, send));
}

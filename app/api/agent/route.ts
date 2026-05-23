import { Agent, CursorAgentError } from "@cursor/sdk";
import { NO_API_KEY_MESSAGE } from "@/lib/agent/api-key-messages";
import { getApiKeyFromCookies } from "@/lib/agent/api-key-cookie";
import { formatAgentStartError } from "@/lib/agent/format-error";
import { buildSystemPrompt, buildUserMessage } from "@/lib/agent/system-prompt";
import { validateApiKey } from "@/lib/agent/validate-api-key";
import { extractYamlFromText } from "@/lib/process/extract-yaml";
import { parseProcessHmi } from "@/lib/process/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface AgentImagePayload {
  data: string;
  mimeType: string;
}

interface AgentRequestBody {
  prompt: string;
  agentId?: string;
  currentYaml?: string;
  image?: AgentImagePayload;
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

const DEFAULT_MODEL = { id: "composer-2.5" } as const;

function localAgentOptions(apiKey: string) {
  return {
    apiKey,
    model: DEFAULT_MODEL,
    local: { cwd: process.cwd(), settingSources: [] },
  };
}

function createLocalAgent(apiKey: string) {
  return Agent.create(localAgentOptions(apiKey));
}

async function openAgent(apiKey: string, agentId?: string) {
  if (!agentId) {
    return { agent: await createLocalAgent(apiKey), resumed: false as const };
  }

  try {
    const agent = await Agent.resume(agentId, localAgentOptions(apiKey));
    return { agent, resumed: true as const };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.warn("[agent] resume failed, creating fresh agent:", err.message);
      return { agent: await createLocalAgent(apiKey), resumed: false as const };
    }
    throw err;
  }
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = await getApiKeyFromCookies();
  if (!apiKey) {
    return Response.json({ error: NO_API_KEY_MESSAGE }, { status: 401 });
  }

  const validation = await validateApiKey(apiKey);
  if (!validation.ok) {
    return Response.json({ error: validation.message }, { status: 401 });
  }

  let body: AgentRequestBody;
  try {
    body = (await request.json()) as AgentRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt?.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEncode(event, data)));
      };

      let assistantText = "";

      try {
        const opened = await openAgent(apiKey, body.agentId);

        await using activeAgent = opened.agent;
        send("agentId", { agentId: activeAgent.agentId, resumed: opened.resumed });

        const userText = buildUserMessage(body.prompt, body.currentYaml);
        const includeSystemPrompt = !opened.resumed;
        const promptText = includeSystemPrompt
          ? `${buildSystemPrompt()}\n\n${userText}`
          : userText;

        const sendOptions = { model: DEFAULT_MODEL };

        const run = body.image
          ? await activeAgent.send(
              {
                text: promptText,
                images: [{ data: body.image.data, mimeType: body.image.mimeType }],
              },
              sendOptions,
            )
          : await activeAgent.send(promptText, sendOptions);

        console.info("[agent] started run", { agentId: activeAgent.agentId, runId: run.id });

        for await (const event of run.stream()) {
          if (event.type === "assistant") {
            for (const block of event.message.content) {
              if (block.type === "text" && block.text) {
                assistantText += block.text;
                send("text_delta", { text: block.text });
              }
            }
          }
        }

        const result = await run.wait();

        if (result.status === "error") {
          send("error", {
            message: "Agent run failed before completing the YAML update.",
            runId: result.id,
            retryable: true,
          });
          controller.close();
          return;
        }

        const extracted = extractYamlFromText(assistantText);
        if (extracted) {
          const parsed = parseProcessHmi(extracted);
          if (parsed.ok) {
            send("yaml", { yaml: extracted, config: parsed.config });
          } else {
            send("yaml_invalid", { yaml: extracted, error: parsed.error });
          }
        } else {
          send("no_yaml", {
            message:
              "Agent replied but did not return a ```yaml code block. Try: \"Move the boiler left — return the complete process-hmi.yaml in a yaml fenced block.\"",
          });
        }

        send("done", { runId: result.id, agentId: activeAgent.agentId });
      } catch (err) {
        const formatted = await formatAgentStartError(err, apiKey);
        send("error", {
          message: formatted.message,
          retryable: formatted.retryable,
          authInvalid: formatted.authInvalid ?? false,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

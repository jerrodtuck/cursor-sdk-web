import { formatAgentStartError } from "@/lib/agent/format-error";
import { DEFAULT_MODEL, openAgent } from "@/lib/agent/open-agent";
import { sseEncode } from "@/lib/agent/sse-encode";
import type { AgentRequestBody } from "@/lib/agent/validate-agent-request";
import { buildSystemPrompt, buildUserMessage } from "@/lib/agent/system-prompt";
import { extractYamlFromText } from "@/lib/process/extract-yaml";
import { parseProcessHmi } from "@/lib/process/parse";

type SendFn = (event: string, data: unknown) => void;

async function streamAssistantText(
  run: Awaited<ReturnType<Awaited<ReturnType<typeof openAgent>>["agent"]["send"]>>,
  send: SendFn,
): Promise<string> {
  let assistantText = "";

  for await (const event of run.stream()) {
    if (event.type !== "assistant") continue;
    for (const block of event.message.content) {
      if (block.type === "text" && block.text) {
        assistantText += block.text;
        send("text_delta", { text: block.text });
      }
    }
  }

  return assistantText;
}

function emitYamlResult(assistantText: string, send: SendFn) {
  const extracted = extractYamlFromText(assistantText);
  if (!extracted) {
    send("no_yaml", {
      message:
        'Agent replied but did not return a ```yaml code block. Try: "Move the boiler left — return the complete process-hmi.yaml in a yaml fenced block."',
    });
    return;
  }

  const parsed = parseProcessHmi(extracted);
  if (parsed.ok) {
    send("yaml", { yaml: extracted, config: parsed.config });
    return;
  }

  send("yaml_invalid", { yaml: extracted, error: parsed.error });
}

async function runAgentTurn(apiKey: string, body: AgentRequestBody, send: SendFn) {
  const opened = await openAgent(apiKey, body.agentId);

  await using activeAgent = opened.agent;
  send("agentId", { agentId: activeAgent.agentId, resumed: opened.resumed });

  const userText = buildUserMessage(body.prompt, body.currentYaml);
  const promptText = opened.resumed ? userText : `${buildSystemPrompt()}\n\n${userText}`;
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

  const assistantText = await streamAssistantText(run, send);
  const result = await run.wait();

  if (result.status === "error") {
    send("error", {
      message: "Agent run failed before completing the YAML update.",
      runId: result.id,
      retryable: true,
    });
    return;
  }

  emitYamlResult(assistantText, send);
  send("done", { runId: result.id, agentId: activeAgent.agentId });
}

export async function streamAgentRun(
  apiKey: string,
  body: AgentRequestBody,
  send: SendFn,
): Promise<void> {
  try {
    await runAgentTurn(apiKey, body, send);
  } catch (err) {
    const formatted = await formatAgentStartError(err, apiKey);
    send("error", {
      message: formatted.message,
      retryable: formatted.retryable,
      authInvalid: formatted.authInvalid ?? false,
    });
  }
}

export function createAgentSseResponse(
  handler: (send: SendFn) => Promise<void>,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send: SendFn = (event, data) => {
        controller.enqueue(encoder.encode(sseEncode(event, data)));
      };

      try {
        await handler(send);
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

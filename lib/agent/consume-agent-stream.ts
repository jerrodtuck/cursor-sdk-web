import type { AgentStreamHandlers } from "./sse-events";
import { parseAgentSseFrame, parseSseBuffer } from "./sse-parser";

function dispatchAgentEvent(event: ReturnType<typeof parseAgentSseFrame>, handlers: AgentStreamHandlers) {
  if (!event) return;

  switch (event.event) {
    case "agentId":
      handlers.onAgentId?.(event.data);
      break;
    case "text_delta":
      handlers.onTextDelta?.(event.data);
      break;
    case "yaml":
      handlers.onYaml?.(event.data);
      break;
    case "yaml_invalid":
      handlers.onYamlInvalid?.(event.data);
      break;
    case "no_yaml":
      handlers.onNoYaml?.(event.data);
      break;
    case "error":
      handlers.onError?.(event.data);
      break;
    case "done":
      handlers.onDone?.(event.data);
      break;
    default:
      break;
  }
}

export async function consumeAgentStream(
  body: ReadableStream<Uint8Array>,
  handlers: AgentStreamHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { frames, rest } = parseSseBuffer(buffer);
    buffer = rest;

    for (const frame of frames) {
      const parsed = parseAgentSseFrame(frame);
      if (!parsed) {
        handlers.onProtocolError?.("Received malformed agent stream event");
        continue;
      }
      dispatchAgentEvent(parsed, handlers);
    }
  }
}

export async function postAgentStream(
  body: Record<string, unknown>,
  handlers: AgentStreamHandlers,
): Promise<void> {
  const response = await fetch("/api/agent", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    const message = payload.error ?? `Request failed (${response.status})`;
    throw new AgentRequestError(message, response.status);
  }

  if (!response.body) throw new Error("No response stream");
  await consumeAgentStream(response.body, handlers);
}

export class AgentRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AgentRequestError";
  }
}

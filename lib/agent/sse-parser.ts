import type { AgentSseEvent, AgentSseEventName } from "./sse-events";

export interface RawSseFrame {
  event: string;
  data: string;
}

export function parseSseBuffer(buffer: string): { frames: RawSseFrame[]; rest: string } {
  const frames: RawSseFrame[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim()) continue;
    let event = "message";
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (data) frames.push({ event, data });
  }

  return { frames, rest };
}

function parseJsonPayload(data: string): unknown {
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return null;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function parseAgentSseEvent(frame: RawSseFrame): AgentSseEvent | null {
  const payload = parseJsonPayload(frame.data);
  if (payload === null || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const name = frame.event as AgentSseEventName;

  switch (name) {
    case "agentId": {
      const agentId = asString(record.agentId);
      const resumed = asBoolean(record.resumed);
      if (!agentId || resumed === null) return null;
      return { event: "agentId", data: { agentId, resumed } };
    }
    case "text_delta": {
      const text = asString(record.text);
      if (!text) return null;
      return { event: "text_delta", data: { text } };
    }
    case "yaml": {
      const yaml = asString(record.yaml);
      if (!yaml) return null;
      return { event: "yaml", data: { yaml } };
    }
    case "yaml_invalid": {
      const yaml = asString(record.yaml);
      const error = asString(record.error);
      if (!yaml || !error) return null;
      return { event: "yaml_invalid", data: { yaml, error } };
    }
    case "no_yaml": {
      const message = asString(record.message);
      if (!message) return null;
      return { event: "no_yaml", data: { message } };
    }
    case "error": {
      const message = asString(record.message);
      if (!message) return null;
      return {
        event: "error",
        data: {
          message,
          retryable: asBoolean(record.retryable) ?? undefined,
          authInvalid: asBoolean(record.authInvalid) ?? undefined,
          runId: asString(record.runId) ?? undefined,
        },
      };
    }
    case "done": {
      const runId = asString(record.runId);
      const agentId = asString(record.agentId);
      if (!runId || !agentId) return null;
      return { event: "done", data: { runId, agentId } };
    }
    default:
      return null;
  }
}

export function parseAgentSseFrame(frame: RawSseFrame): AgentSseEvent | null {
  return parseAgentSseEvent(frame);
}

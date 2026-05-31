import type { ProcessHmiConfig } from "@/lib/process/schema";

export type AgentSseEventName =
  | "agentId"
  | "text_delta"
  | "yaml"
  | "yaml_invalid"
  | "no_yaml"
  | "error"
  | "done";

export interface AgentSseAgentIdPayload {
  agentId: string;
  resumed: boolean;
}

export interface AgentSseTextDeltaPayload {
  text: string;
}

export interface AgentSseYamlPayload {
  yaml: string;
  config?: ProcessHmiConfig;
}

export interface AgentSseYamlInvalidPayload {
  yaml: string;
  error: string;
}

export interface AgentSseNoYamlPayload {
  message: string;
}

export interface AgentSseErrorPayload {
  message: string;
  retryable?: boolean;
  authInvalid?: boolean;
  runId?: string;
}

export interface AgentSseDonePayload {
  runId: string;
  agentId: string;
}

export type AgentSseEvent =
  | { event: "agentId"; data: AgentSseAgentIdPayload }
  | { event: "text_delta"; data: AgentSseTextDeltaPayload }
  | { event: "yaml"; data: AgentSseYamlPayload }
  | { event: "yaml_invalid"; data: AgentSseYamlInvalidPayload }
  | { event: "no_yaml"; data: AgentSseNoYamlPayload }
  | { event: "error"; data: AgentSseErrorPayload }
  | { event: "done"; data: AgentSseDonePayload };

export interface AgentStreamHandlers {
  onAgentId?: (data: AgentSseAgentIdPayload) => void;
  onTextDelta?: (data: AgentSseTextDeltaPayload) => void;
  onYaml?: (data: AgentSseYamlPayload) => void;
  onYamlInvalid?: (data: AgentSseYamlInvalidPayload) => void;
  onNoYaml?: (data: AgentSseNoYamlPayload) => void;
  onError?: (data: AgentSseErrorPayload) => void;
  onDone?: (data: AgentSseDonePayload) => void;
  onProtocolError?: (message: string) => void;
}

export interface AgentImagePayload {
  data: string;
  mimeType: string;
}

export interface DiagramGenerateRequest {
  prompt: string;
  image: AgentImagePayload;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

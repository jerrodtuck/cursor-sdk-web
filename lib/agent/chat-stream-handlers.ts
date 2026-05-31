import type { AgentStreamHandlers } from "@/lib/agent/sse-events";
import { clearStoredAgentId, setStoredAgentId } from "@/lib/agent/client-store";
import type { ChatMessage } from "@/lib/agent/types";

interface ChatHandlerContext {
  onYamlApplied: (yaml: string) => void;
  onAuthError?: (message: string) => void;
  assistantBufferRef: React.MutableRefObject<string>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setLastYaml: React.Dispatch<React.SetStateAction<string | null>>;
}

function updateAssistantMessage(
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  content: string,
) {
  setMessages((prev) => {
    const next = [...prev];
    const last = next[next.length - 1];
    if (last?.role === "assistant") next[next.length - 1] = { ...last, content };
    return next;
  });
}

export function createChatStreamHandlers(ctx: ChatHandlerContext): AgentStreamHandlers {
  return {
    onAgentId: (data) => setStoredAgentId(data.agentId),
    onTextDelta: (data) => {
      ctx.assistantBufferRef.current += data.text;
      updateAssistantMessage(ctx.setMessages, ctx.assistantBufferRef.current);
    },
    onYaml: (data) => {
      ctx.setLastYaml(data.yaml);
      ctx.onYamlApplied(data.yaml);
      updateAssistantMessage(
        ctx.setMessages,
        "Updated process-hmi.yaml — see the editor and live preview.",
      );
    },
    onYamlInvalid: (data) => {
      ctx.setError(`Agent YAML invalid: ${data.error}`);
      ctx.setLastYaml(data.yaml);
    },
    onNoYaml: (data) => ctx.setError(data.message),
    onError: (data) => {
      ctx.setError(data.message);
      if (data.authInvalid) ctx.onAuthError?.(data.message);
      if (data.message.toLowerCase().includes("not found")) clearStoredAgentId();
    },
  };
}

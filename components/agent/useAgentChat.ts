"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearStoredAgentId,
  getStoredAgentId,
} from "@/lib/agent/client-store";
import { AgentRequestError, postAgentStream } from "@/lib/agent/consume-agent-stream";
import { createChatStreamHandlers } from "@/lib/agent/chat-stream-handlers";
import type { ChatMessage } from "@/lib/agent/types";

interface UseAgentChatOptions {
  currentYaml: string;
  onYamlApplied: (yaml: string) => void;
  apiConnected: boolean;
  onAuthError?: (message: string) => void;
}

export function displayAssistantContent(content: string, streaming: boolean): string {
  const hasYamlBlock = content.includes("```yaml") || content.includes("```yml");
  const looksLikeYaml = /^\s*diagram:\s*$/m.test(content);

  if (hasYamlBlock || looksLikeYaml) {
    return streaming
      ? "Generating updated process-hmi.yaml…"
      : "Updated process-hmi.yaml — see the editor and live preview.";
  }

  return content;
}

export function useAgentChat({
  currentYaml,
  onYamlApplied,
  apiConnected,
  onAuthError,
}: UseAgentChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastYaml, setLastYaml] = useState<string | null>(null);
  const assistantBufferRef = useRef("");

  const sendPrompt = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || streaming || !apiConnected) return;

    setInput("");
    setError(null);
    setStreaming(true);
    assistantBufferRef.current = "";
    setMessages((prev) => [...prev, { role: "user", content: prompt }, { role: "assistant", content: "" }]);

    const handlers = createChatStreamHandlers({
      onYamlApplied,
      onAuthError,
      assistantBufferRef,
      setMessages,
      setError,
      setLastYaml,
    });

    try {
      await postAgentStream(
        { prompt, agentId: getStoredAgentId() ?? undefined, currentYaml },
        handlers,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach agent");
      if (err instanceof AgentRequestError && err.status === 401) onAuthError?.(err.message);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && !last.content) next.pop();
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }, [apiConnected, currentYaml, input, onAuthError, onYamlApplied, streaming]);

  const resetSession = useCallback(() => {
    clearStoredAgentId();
    setMessages([]);
    setError(null);
    setLastYaml(null);
  }, []);

  return {
    messages,
    input,
    setInput,
    streaming,
    error,
    lastYaml,
    sendPrompt,
    resetSession,
    canSend: apiConnected && !streaming && input.trim().length > 0,
  };
}

export function useAutoResizeTextarea(input: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  return textareaRef;
}

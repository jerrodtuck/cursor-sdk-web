"use client";

import {
  displayAssistantContent,
  useAgentChat,
  useAutoResizeTextarea,
} from "@/components/agent/useAgentChat";

interface AgentChatPanelProps {
  currentYaml: string;
  onYamlApplied: (yaml: string) => void;
  apiConnected: boolean;
  onAuthError?: (message: string) => void;
}

function ChatHeader({ onReset }: { onReset: () => void }) {
  return (
    <div className="mb-2 flex shrink-0 items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
        Chat
      </h2>
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        New session
      </button>
    </div>
  );
}

function ChatMessages({
  messages,
  streaming,
}: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  streaming: boolean;
}) {
  if (messages.length === 0) {
    return (
      <p className="text-xs text-[var(--foreground-muted)]">
        Refine via chat: &quot;Move the boiler left — return the complete process-hmi.yaml&quot;
      </p>
    );
  }

  return (
    <>
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`rounded-md p-2 text-xs ${
            message.role === "user"
              ? "bg-[var(--accent-muted)] text-[var(--foreground)]"
              : "bg-[var(--surface)] whitespace-pre-wrap text-[var(--foreground)]"
          }`}
        >
          <div className="mb-1 text-[10px] uppercase tracking-wide text-[var(--foreground-muted)]">
            {message.role}
          </div>
          {message.role === "assistant"
            ? displayAssistantContent(message.content, streaming && index === messages.length - 1)
            : message.content}
          {!message.content &&
          streaming &&
          message.role === "assistant" &&
          index === messages.length - 1
            ? "…"
            : ""}
        </div>
      ))}
    </>
  );
}

function ChatInput({
  apiConnected,
  input,
  setInput,
  canSend,
  streaming,
  sendPrompt,
  textareaRef,
}: {
  apiConnected: boolean;
  input: string;
  setInput: (value: string) => void;
  canSend: boolean;
  streaming: boolean;
  sendPrompt: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div
      className={`rounded-xl border bg-[var(--surface)] p-2 shadow-sm transition-shadow ${
        apiConnected
          ? "border-[var(--border)] focus-within:border-[var(--accent)]/40 focus-within:ring-2 focus-within:ring-[var(--accent)]/20"
          : "border-[var(--border)] opacity-60"
      }`}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (canSend) void sendPrompt();
          }
        }}
        disabled={!apiConnected || streaming}
        placeholder={
          apiConnected
            ? "Describe changes to the HMI config…"
            : "Connect your Cursor API key above to use chat"
        }
        rows={1}
        className="max-h-[120px] w-full resize-none border-0 bg-transparent px-1 py-1 text-xs leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)] disabled:cursor-not-allowed"
      />
      <div className="mt-1 flex items-center justify-between gap-2 px-1">
        <span className="text-[10px] text-[var(--foreground-muted)]">
          {apiConnected ? "Enter to send · Shift+Enter for newline" : ""}
        </span>
        <button
          type="button"
          onClick={() => void sendPrompt()}
          disabled={!canSend}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {streaming ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending
            </>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </div>
  );
}

export function AgentChatPanel({
  currentYaml,
  onYamlApplied,
  apiConnected,
  onAuthError,
}: AgentChatPanelProps) {
  const chat = useAgentChat({ currentYaml, onYamlApplied, apiConnected, onAuthError });
  const textareaRef = useAutoResizeTextarea(chat.input);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatHeader onReset={chat.resetSession} />

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-2">
        <ChatMessages messages={chat.messages} streaming={chat.streaming} />
      </div>

      {chat.error ? (
        <p className="mt-2 shrink-0 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-[var(--alarm-critical)]">
          {chat.error}
        </p>
      ) : null}

      {chat.lastYaml && chat.error ? (
        <button
          type="button"
          onClick={() => onYamlApplied(chat.lastYaml!)}
          className="mt-2 shrink-0 rounded-md border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground-muted)] hover:bg-[var(--surface-raised)]"
        >
          Apply YAML anyway
        </button>
      ) : null}

      <div className="mt-2 shrink-0">
        <ChatInput
          apiConnected={apiConnected}
          input={chat.input}
          setInput={chat.setInput}
          canSend={chat.canSend}
          streaming={chat.streaming}
          sendPrompt={chat.sendPrompt}
          textareaRef={textareaRef}
        />
      </div>
    </div>
  );
}

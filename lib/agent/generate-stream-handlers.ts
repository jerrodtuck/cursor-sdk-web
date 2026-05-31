import type { AgentStreamHandlers } from "@/lib/agent/sse-events";
import {
  clearStoredAgentId,
  setStoredAgentId,
} from "@/lib/agent/client-store";
import type { GenerateProgress } from "@/lib/agent/generate-progress";
import { progressLabel, IDLE_PROGRESS } from "@/lib/agent/generate-progress";

interface GenerateHandlerContext {
  onYamlChange: (yaml: string) => void;
  onAuthError: (message: string) => void;
  setGenerateError: (message: string | null) => void;
  setGenerateProgress: React.Dispatch<React.SetStateAction<GenerateProgress>>;
  completeResetRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

function setGenerateFailure(
  message: string,
  ctx: GenerateHandlerContext,
) {
  ctx.setGenerateError(message);
  ctx.setGenerateProgress((prev) => ({
    ...prev,
    phase: "error",
    label: progressLabel("error", prev.fileName),
    detail: message,
  }));
}

function scheduleProgressReset(
  ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  setProgress: React.Dispatch<React.SetStateAction<GenerateProgress>>,
) {
  ref.current = setTimeout(() => {
    setProgress(IDLE_PROGRESS);
    ref.current = null;
  }, 5000);
}

export function createGenerateStreamHandlers(ctx: GenerateHandlerContext): AgentStreamHandlers {
  return {
    onAgentId: (data) => {
      setStoredAgentId(data.agentId);
      ctx.setGenerateProgress((prev) => ({
        ...prev,
        phase: "analyzing",
        label: progressLabel("analyzing", prev.fileName),
        detail: "Agent is reading the drawing and drafting YAML…",
      }));
    },
    onTextDelta: () => {
      ctx.setGenerateProgress((prev) => ({
        ...prev,
        phase: "analyzing",
        detail: "Receiving agent response…",
      }));
    },
    onYaml: (data) => {
      ctx.onYamlChange(data.yaml);
      ctx.setGenerateProgress((prev) => ({
        ...prev,
        phase: "complete",
        label: progressLabel("complete", prev.fileName),
        detail: "YAML validated — preview updated.",
      }));
      scheduleProgressReset(ctx.completeResetRef, ctx.setGenerateProgress);
    },
    onYamlInvalid: (data) => setGenerateFailure(data.error, ctx),
    onNoYaml: (data) => setGenerateFailure(data.message, ctx),
    onError: (data) => {
      setGenerateFailure(data.message, ctx);
      if (data.authInvalid) ctx.onAuthError(data.message);
      if (data.message.toLowerCase().includes("not found")) clearStoredAgentId();
    },
  };
}

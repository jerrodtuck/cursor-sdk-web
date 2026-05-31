"use client";

import { useCallback, useRef, useState } from "react";
import type { DiagramGenerateRequest } from "@/lib/agent/types";
import { AgentRequestError, postAgentStream } from "@/lib/agent/consume-agent-stream";
import { createGenerateStreamHandlers } from "@/lib/agent/generate-stream-handlers";
import {
  IDLE_PROGRESS,
  type GenerateProgress,
  progressLabel,
} from "@/lib/agent/generate-progress";
import { getStoredAgentId } from "@/lib/agent/client-store";

interface UseGenerateHmiOptions {
  apiConnected: boolean;
  yaml: string;
  onYamlChange: (yaml: string) => void;
  onAuthError: (message: string) => void;
}

export function useGenerateHmi({
  apiConnected,
  yaml,
  onYamlChange,
  onAuthError,
}: UseGenerateHmiOptions) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState<GenerateProgress>(IDLE_PROGRESS);
  const completeResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runGenerate = useCallback(
    async (request: DiagramGenerateRequest) => {
      if (!apiConnected || generating) return;

      setGenerating(true);
      setGenerateError(null);
      if (completeResetRef.current) {
        clearTimeout(completeResetRef.current);
        completeResetRef.current = null;
      }

      setGenerateProgress((prev) => ({
        phase: "uploading",
        label: progressLabel("uploading", prev.fileName),
        fileName: prev.fileName,
      }));

      const handlers = createGenerateStreamHandlers({
        onYamlChange,
        onAuthError,
        setGenerateError,
        setGenerateProgress,
        completeResetRef,
      });

      try {
        await postAgentStream(
          {
            prompt: request.prompt,
            agentId: getStoredAgentId() ?? undefined,
            currentYaml: yaml,
            image: request.image,
          },
          handlers,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        if (err instanceof AgentRequestError && err.status === 401) onAuthError(message);
        setGenerateError(message);
        setGenerateProgress((prev) => ({
          ...prev,
          phase: "error",
          label: progressLabel("error", prev.fileName),
          detail: message,
        }));
      } finally {
        setGenerating(false);
      }
    },
    [apiConnected, generating, onAuthError, onYamlChange, yaml],
  );

  return {
    generating,
    generateError,
    setGenerateError,
    generateProgress,
    setGenerateProgress,
    runGenerate,
  };
}

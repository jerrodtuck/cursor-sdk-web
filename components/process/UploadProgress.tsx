"use client";

import {
  GENERATE_STEPS,
  type GenerateProgress,
  stepState,
} from "@/lib/agent/generate-progress";

interface UploadProgressProps {
  progress: GenerateProgress;
  isPdf?: boolean;
}

function StepIcon({ state }: { state: "pending" | "active" | "done" }) {
  if (state === "done") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--alarm-ok)] text-white">
        <svg aria-hidden className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6l2.5 2.5 4.5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (state === "active") {
    return (
      <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
    );
  }

  return <span className="h-4 w-4 shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)]" />;
}

export function UploadProgress({ progress, isPdf = false }: UploadProgressProps) {
  if (progress.phase === "idle") return null;

  const isError = progress.phase === "error";
  const isComplete = progress.phase === "complete";

  return (
    <div
      className={`mt-2 rounded-lg border px-3 py-2.5 ${
        isError
          ? "border-red-200 bg-red-50"
          : isComplete
            ? "border-emerald-200 bg-emerald-50"
            : "border-[var(--border)] bg-[var(--surface)]"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        {!isComplete && !isError ? (
          <span className="mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        ) : null}
        {isComplete ? (
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--alarm-ok)] text-white">
            <svg aria-hidden className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6l2.5 2.5 4.5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-medium ${
              isError
                ? "text-[var(--alarm-critical)]"
                : isComplete
                  ? "text-[var(--alarm-ok)]"
                  : "text-[var(--foreground)]"
            }`}
          >
            {progress.label}
          </p>
          {progress.fileName ? (
            <p className="mt-0.5 truncate text-[10px] text-[var(--foreground-muted)]">{progress.fileName}</p>
          ) : null}
          {progress.detail ? (
            <p className="mt-1 text-[10px] text-[var(--foreground-muted)]">{progress.detail}</p>
          ) : null}
        </div>
      </div>

      {!isError ? (
        <ol className="mt-2.5 space-y-1.5 border-t border-[var(--border)]/60 pt-2">
          {GENERATE_STEPS.map((step) => {
            const state = stepState(step.id, progress.phase, isPdf);
            const label = step.id === "prepare" && isPdf ? "Rasterize PDF" : step.label;

            return (
              <li key={step.id} className="flex items-center gap-2">
                <StepIcon state={state} />
                <span
                  className={`text-[10px] ${
                    state === "active"
                      ? "font-medium text-[var(--foreground)]"
                      : state === "done"
                        ? "text-[var(--foreground-muted)]"
                        : "text-[var(--foreground-muted)]/70"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

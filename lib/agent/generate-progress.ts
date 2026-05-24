export type GeneratePhase =
  | "idle"
  | "reading"
  | "rasterizing"
  | "uploading"
  | "analyzing"
  | "complete"
  | "error";

export interface GenerateProgress {
  phase: GeneratePhase;
  label: string;
  fileName?: string | null;
  detail?: string | null;
}

export const IDLE_PROGRESS: GenerateProgress = {
  phase: "idle",
  label: "",
};

export function progressLabel(phase: GeneratePhase, fileName?: string | null): string {
  switch (phase) {
    case "reading":
      return fileName ? `Reading ${fileName}…` : "Reading file…";
    case "rasterizing":
      return fileName ? `Rasterizing ${fileName}…` : "Rasterizing PDF page…";
    case "uploading":
      return "Sending drawing to agent…";
    case "analyzing":
      return "Agent analyzing drawing…";
    case "complete":
      return "HMI config generated";
    case "error":
      return "Generation failed";
    default:
      return "";
  }
}

export const GENERATE_STEPS = [
  { id: "read", label: "Read file" },
  { id: "prepare", label: "Prepare image" },
  { id: "analyze", label: "Analyze drawing" },
  { id: "yaml", label: "Generate YAML" },
] as const;

export function stepState(
  stepId: (typeof GENERATE_STEPS)[number]["id"],
  phase: GeneratePhase,
  isPdf: boolean,
): "pending" | "active" | "done" {
  const order = ["read", "prepare", "analyze", "yaml"] as const;
  const phaseIndex: Record<GeneratePhase, number> = {
    idle: -1,
    reading: 0,
    rasterizing: 1,
    uploading: 2,
    analyzing: 3,
    complete: 4,
    error: -1,
  };

  const current = phaseIndex[phase];
  const stepIdx = order.indexOf(stepId);

  if (phase === "complete") return "done";
  if (phase === "error") {
    if (stepIdx < current) return "done";
    if (stepIdx === current) return "active";
    return "pending";
  }

  if (stepId === "prepare" && !isPdf && phase === "reading") {
    return "active";
  }

  if (stepIdx < current) return "done";
  if (stepIdx === current) return "active";
  return "pending";
}

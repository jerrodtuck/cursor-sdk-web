import yaml from "js-yaml";
import { processHmiConfigSchema, type ProcessHmiConfig } from "./schema";

export type ParseResult =
  | { ok: true; config: ProcessHmiConfig }
  | { ok: false; error: string };

export function parseProcessHmi(source: string): ParseResult {
  if (!source.trim()) {
    return { ok: false, error: "YAML is empty" };
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid YAML syntax";
    return { ok: false, error: message };
  }

  const result = processHmiConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "root";
        return `${path}: ${issue.message}`;
      })
      .join("; ");
    return { ok: false, error: issues };
  }

  const nodeIds = new Set(result.data.nodes.map((n) => n.id));
  for (const edge of result.data.edges) {
    if (!nodeIds.has(edge.from.node)) {
      return { ok: false, error: `edge ${edge.id}: unknown from node ${edge.from.node}` };
    }
    if (!nodeIds.has(edge.to.node)) {
      return { ok: false, error: `edge ${edge.id}: unknown to node ${edge.to.node}` };
    }
  }

  return { ok: true, config: result.data };
}

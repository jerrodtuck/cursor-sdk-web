export function severityStroke(severity: string): string {
  switch (severity) {
    case "hiHi":
    case "loLo":
      return "var(--alarm-critical)";
    case "hi":
    case "lo":
      return "var(--alarm-warn)";
    default:
      return "var(--foreground-muted)";
  }
}

export const symbolStroke = "var(--foreground-muted)";
export const symbolFill = "var(--surface)";
export const symbolAccent = "var(--accent)";

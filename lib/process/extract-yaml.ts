const YAML_FENCE = /```(?:yaml|yml)\s*\n([\s\S]*?)```/i;

export function extractYamlFromText(text: string): string | null {
  const match = text.match(YAML_FENCE);
  if (match?.[1]) {
    return match[1].trim();
  }

  const trimmed = text.trim();
  if (trimmed.startsWith("diagram:")) {
    return trimmed;
  }

  return null;
}

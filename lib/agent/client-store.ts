const AGENT_ID_KEY = "pad-hmi-agent-id";

export function getStoredAgentId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AGENT_ID_KEY);
}

export function setStoredAgentId(agentId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AGENT_ID_KEY, agentId);
}

export function clearStoredAgentId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AGENT_ID_KEY);
}

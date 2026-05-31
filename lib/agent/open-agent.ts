import { Agent, CursorAgentError } from "@cursor/sdk";

const DEFAULT_MODEL = { id: "composer-2.5" } as const;

export function localAgentOptions(apiKey: string) {
  return {
    apiKey,
    model: DEFAULT_MODEL,
    local: { cwd: process.cwd(), settingSources: [] },
  };
}

export function createLocalAgent(apiKey: string) {
  return Agent.create(localAgentOptions(apiKey));
}

export async function openAgent(apiKey: string, agentId?: string) {
  if (!agentId) {
    return { agent: await createLocalAgent(apiKey), resumed: false as const };
  }

  try {
    const agent = await Agent.resume(agentId, localAgentOptions(apiKey));
    return { agent, resumed: true as const };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.warn("[agent] resume failed, creating fresh agent:", err.message);
      return { agent: await createLocalAgent(apiKey), resumed: false as const };
    }
    throw err;
  }
}

export { DEFAULT_MODEL };

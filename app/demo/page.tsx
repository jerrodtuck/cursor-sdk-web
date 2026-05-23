import fs from "node:fs";
import path from "node:path";
import { DesignerApp } from "@/components/DesignerApp";
import { resolveApiKey } from "@/lib/agent/api-key-cookie";
import { validateApiKey } from "@/lib/agent/validate-api-key";

export default async function DemoPage() {
  const fixturePath = path.join(process.cwd(), "fixtures/pfd-sample.yaml");
  const initialYaml = fs.readFileSync(fixturePath, "utf-8");
  const resolved = await resolveApiKey();
  let initialApiConnected = false;
  let initialApiSource: "cookie" | "env" | null = null;

  if (resolved.apiKey) {
    const validation = await validateApiKey(resolved.apiKey);
    initialApiConnected = validation.ok;
    if (validation.ok) {
      initialApiSource = resolved.source ?? null;
    }
  }

  return (
    <DesignerApp
      initialYaml={initialYaml}
      initialApiConnected={initialApiConnected}
      initialApiSource={initialApiSource}
      defaultSourceImage="/examples/pid_example.png"
    />
  );
}

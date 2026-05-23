import { ExternalLink } from "@/components/site/ExternalLink";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteLinks } from "@/lib/site/links";

const codeExample = `await using agent = await Agent.create({
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: "composer-2.5" },
  local: { cwd: process.cwd(), settingSources: [] },
});

const run = await agent.send(prompt);

for await (const event of run.stream()) {
  // Stream events to the client via SSE
}

await run.wait();`;

export function CodeExampleSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface-raised)]/50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionKicker label="sdk quick start" className="mb-3" />
        <h2 className="section-title">Core integration pattern</h2>
        <p className="mt-3 text-[var(--foreground-muted)]">
          The demo&apos;s API route follows this pattern from{" "}
          <code className="rounded bg-[var(--surface)] px-1 font-mono text-sm">app/api/agent/route.ts</code>.
        </p>
        <pre className="panel mt-8 overflow-x-auto p-5 font-mono text-xs leading-relaxed text-[var(--foreground)] sm:text-sm">
          <code>{codeExample}</code>
        </pre>
        <p className="mt-4 text-sm">
          <ExternalLink href={siteLinks.sdkTypeScript} className="text-[var(--accent)] hover:underline">
            Full API reference → TypeScript SDK docs
          </ExternalLink>
        </p>
      </div>
    </section>
  );
}

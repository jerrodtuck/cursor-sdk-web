import { SectionKicker } from "@/components/site/SectionKicker";

const learnItems = [
  { demo: "Diagram upload (PNG / PDF)", sdk: "Vision + Agent.send with images[]" },
  { demo: "Agent chat refinements", sdk: "Agent.create + multi-turn Agent.resume" },
  { demo: "Streaming responses", sdk: "run.stream() over Server-Sent Events" },
  { demo: "process-hmi.yaml output", sdk: "Structured extraction + Zod validation" },
  { demo: "SVG canvas preview", sdk: "Render validated config with live mock tags" },
  { demo: "HttpOnly API key connect", sdk: "Secure BYOK for hosted demos" },
];

export function LearnSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionKicker label="demo to sdk" className="mb-3" />
        <h2 className="section-title">What you&apos;ll learn</h2>
        <p className="mt-3 text-[var(--foreground-muted)]">
          Each part of the demo maps directly to a Cursor SDK concept.
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {learnItems.map((item) => (
            <div
              key={item.demo}
              className="panel flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-medium text-[var(--foreground)]">{item.demo}</span>
              <span className="font-mono text-xs text-[var(--accent)]">{item.sdk}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

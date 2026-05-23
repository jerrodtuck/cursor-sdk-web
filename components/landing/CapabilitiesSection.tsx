import { SectionKicker } from "@/components/site/SectionKicker";

const capabilities = [
  {
    title: "Vision + structured output",
    body: "Upload a P&ID or PFD — the agent returns validated process-hmi.yaml with equipment topology and ISA-style tags.",
  },
  {
    title: "Real SDK patterns",
    body: "Agent.create, Agent.resume, image attachments, SSE streaming, and Zod validation in a Next.js Route Handler.",
  },
  {
    title: "Works without your API key",
    body: "Fixture preview runs offline. Connect your key via HttpOnly cookie to generate from uploads, or clone locally.",
  },
];

export function CapabilitiesSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionKicker label="capabilities" className="mb-3" />
        <h2 className="section-title">Why this demo exists</h2>
        <p className="mt-3 max-w-2xl text-[var(--foreground-muted)]">
          Built for developers evaluating the Cursor SDK who want vision, streaming, and
          structured extraction in one integration.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {capabilities.map((item) => (
            <li key={item.title} className="panel p-5">
              <h3 className="font-semibold text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

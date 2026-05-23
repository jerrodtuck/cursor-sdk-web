import { SectionKicker } from "@/components/site/SectionKicker";

export function BeforeAfterSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionKicker label="before vs after" className="mb-3" />
        <h2 className="section-title">YAML + chat beats a design canvas</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="panel border-[var(--border)] p-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              − before
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
              Open a SCADA or HMI builder → drag symbols onto a canvas → wire tags manually →
              export a static screen → repeat for every drawing revision.
            </p>
          </div>
          <div className="panel border-[var(--accent)]/20 bg-[var(--accent-muted)] p-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              + after
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]">
              Upload a P&amp;ID → agent returns process-hmi.yaml → live SVG preview updates →
              refine via chat (&quot;move the boiler left&quot;) or edit YAML directly. No
              drag-and-drop designer required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

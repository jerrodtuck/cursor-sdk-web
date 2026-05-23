import { SectionKicker } from "@/components/site/SectionKicker";

const steps = [
  {
    step: "01",
    title: "Load the sample PFD",
    body: "The demo fixture renders as an SVG process-flow HMI with simulated instrument values.",
  },
  {
    step: "02",
    title: "Upload your drawing",
    body: "Drop a PNG, JPEG, or PDF — the Cursor agent extracts equipment, piping, and tags.",
  },
  {
    step: "03",
    title: "Edit YAML manually",
    body: "Tweak node positions, tags, and alarms in process-hmi.yaml with inline validation.",
  },
  {
    step: "04",
    title: "Watch live values",
    body: "Instrument bubbles and alarm colors update on the SVG canvas in real time.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface-raised)]/50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionKicker label="how it works" className="mb-3" />
        <h2 className="section-title">From drawing to live HMI</h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <li key={item.step} className="panel p-5">
              <span className="step-badge">{item.step}</span>
              <h3 className="mt-4 font-semibold text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

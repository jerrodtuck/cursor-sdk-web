import { SectionKicker } from "@/components/site/SectionKicker";

const layers = [
  {
    step: "01",
    title: "Upload",
    body: "Drop a PNG, JPEG, or PDF P&ID. The agent reads equipment, piping, and instrument tags from the drawing.",
  },
  {
    step: "02",
    title: "Agent",
    body: "Cursor SDK streams a vision run — Agent.create, image attachment, SSE to the browser.",
  },
  {
    step: "03",
    title: "YAML",
    body: "Validated process-hmi.yaml with normalized positions, edges, ISA tags, and alarm limits.",
  },
  {
    step: "04",
    title: "HMI canvas",
    body: "Live SVG preview with instrument bubbles, alarm colors, and chat-driven refinements.",
  },
];

export function ArchitectureSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface-raised)]/50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionKicker label="architecture" className="mb-3" />
        <h2 className="section-title">Four layers, one pipeline</h2>
        <p className="mt-3 max-w-2xl text-[var(--foreground-muted)]">
          Upload a drawing, let the agent extract structure, validate YAML, and render a live
          operator-style canvas — no drag-and-drop designer required.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {layers.map((layer, index) => (
            <li key={layer.step} className="panel p-5">
              <span className={`step-badge ${index === 0 ? "step-badge-active" : ""}`}>
                {layer.step}
              </span>
              <h3 className="mt-4 font-semibold text-[var(--foreground)]">{layer.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                {layer.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

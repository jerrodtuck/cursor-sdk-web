import Link from "next/link";
import { ExternalLink } from "@/components/site/ExternalLink";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteLinks } from "@/lib/site/links";

export function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionKicker label="open source demo" className="mb-4" />
          <h1 className="section-title text-4xl sm:text-5xl">
            Upload a P&amp;ID — get a live process-flow HMI
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--foreground-muted)]">
            Turn P&amp;ID and PFD drawings into interactive SVG operator screens with simulated
            live values. Powered by{" "}
            <code className="rounded bg-[var(--surface-raised)] px-1.5 py-0.5 font-mono text-sm text-[var(--accent)]">
              @cursor/sdk
            </code>{" "}
            for vision extraction, streaming agents, and structured YAML output.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="btn-primary">
              Try the demo
            </Link>
            <ExternalLink href={siteLinks.repo} className="btn-secondary">
              View on GitHub
            </ExternalLink>
          </div>
        </div>

        <div className="panel p-6">
          <SectionKicker label="integration flow" className="mb-4" />
          <div className="flex flex-col gap-3 font-mono text-sm">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--foreground)]">
              P&amp;ID / PDF upload
            </div>
            <div className="flex justify-center text-[var(--foreground-muted)]">↓</div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--accent)]">
              process-hmi.yaml
            </div>
            <div className="flex justify-center text-[var(--foreground-muted)]">↓</div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--alarm-ok)]">
              SVG process-flow HMI
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

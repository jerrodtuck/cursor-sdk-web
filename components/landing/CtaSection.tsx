import Link from "next/link";
import { AuthorCredit } from "@/components/site/AuthorCredit";
import { ExternalLink } from "@/components/site/ExternalLink";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteLinks } from "@/lib/site/links";

export function CtaSection() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface-raised)]/50 py-16">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <SectionKicker label="ready?" className="mb-3" />
        <h2 className="section-title">Try it with your own P&amp;ID</h2>
        <p className="mx-auto mt-4 max-w-xl text-[var(--foreground-muted)]">
          Connect your Cursor API key, upload a drawing, and watch the agent build a live
          process-flow HMI. Clone the repo to run locally with full control.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/demo" className="btn-primary">
            Open the interactive demo
          </Link>
          <ExternalLink href={siteLinks.repo} className="btn-secondary">
            Star on GitHub
          </ExternalLink>
          <ExternalLink href={siteLinks.x} className="btn-secondary">
            Follow @jerrodtuck
          </ExternalLink>
        </div>
        <div className="mt-10">
          <AuthorCredit />
        </div>
      </div>
    </section>
  );
}

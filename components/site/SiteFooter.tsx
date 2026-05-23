import Link from "next/link";
import { AuthorCredit } from "@/components/site/AuthorCredit";
import { ExternalLink } from "@/components/site/ExternalLink";
import { SocialLinks } from "@/components/site/SocialLinks";
import { siteLinks } from "@/lib/site/links";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">P&amp;ID → HMI</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
              Open-source demo showing how to turn P&amp;ID drawings into live SVG process-flow
              HMIs with the Cursor SDK.
            </p>
            <div className="mt-4">
              <AuthorCredit />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Documentation</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <ExternalLink href={siteLinks.sdkTypeScript} className="text-[var(--foreground-muted)] hover:text-[var(--accent)]">
                  TypeScript SDK
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={siteLinks.sdkPython} className="text-[var(--foreground-muted)] hover:text-[var(--accent)]">
                  Python SDK
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={siteLinks.mcp} className="text-[var(--foreground-muted)] hover:text-[var(--accent)]">
                  MCP docs
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={siteLinks.apiKey} className="text-[var(--foreground-muted)] hover:text-[var(--accent)]">
                  Get an API key
                </ExternalLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Project</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="/demo" className="text-[var(--foreground-muted)] hover:text-[var(--accent)]">
                  Interactive demo
                </Link>
              </li>
              <li>
                <ExternalLink href={siteLinks.repo} className="text-[var(--foreground-muted)] hover:text-[var(--accent)]">
                  GitHub repository
                </ExternalLink>
              </li>
              <li>
                <span className="text-[var(--foreground-muted)]">Product spec: docs/PRD.md</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Connect</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <ExternalLink href={siteLinks.x} className="text-[var(--foreground-muted)] hover:text-[var(--accent)]">
                  @jerrodtuck on X
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={siteLinks.author} className="text-[var(--foreground-muted)] hover:text-[var(--accent)]">
                  jerrodtuck.com
                </ExternalLink>
              </li>
            </ul>
            <div className="mt-4">
              <SocialLinks variant="footer" showLabels />
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-[var(--border)] pt-6 text-xs text-[var(--foreground-muted)]">
          © {new Date().getFullYear()}{" "}
          <ExternalLink href={siteLinks.author} className="hover:text-[var(--accent)]">
            Jerrod Tuck
          </ExternalLink>
          . Hosted demo uses your own{" "}
          <code className="font-mono text-[var(--foreground)]">CURSOR_API_KEY</code> via HttpOnly
          cookie.
        </p>
      </div>
    </footer>
  );
}

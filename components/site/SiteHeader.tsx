"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "@/components/site/ExternalLink";
import { SocialLinks } from "@/components/site/SocialLinks";
import { siteLinks } from "@/lib/site/links";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
] as const;

function navClass(isActive: boolean): string {
  return isActive
    ? "text-[var(--accent)] bg-[var(--accent-muted)]"
    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]";
}

function BrandMark() {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <span className="grid grid-cols-2 gap-0.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" />
        <span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)] opacity-70" />
        <span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)] opacity-70" />
        <span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" />
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <span className="truncate text-sm font-semibold tracking-tight text-[var(--foreground)]">
            P&amp;ID → HMI
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${navClass(isActive)}`}
              >
                {item.label}
              </Link>
            );
          })}
          <ExternalLink
            href={siteLinks.sdkTypeScript}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
          >
            SDK Docs
          </ExternalLink>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <SocialLinks variant="header" />
          <Link href="/demo" className="btn-primary ml-1 px-3 py-1.5 text-xs sm:text-sm">
            Try demo
          </Link>
        </div>
      </div>
    </header>
  );
}

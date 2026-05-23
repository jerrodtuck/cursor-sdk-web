import { ExternalLink } from "@/components/site/ExternalLink";
import { siteLinks } from "@/lib/site/links";

interface AuthorCreditProps {
  className?: string;
}

export function AuthorCredit({ className = "" }: AuthorCreditProps) {
  return (
    <p className={`text-sm text-[var(--foreground-muted)] ${className}`.trim()}>
      Built by{" "}
      <ExternalLink href={siteLinks.author} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
        Jerrod Tuck
      </ExternalLink>
      {" "}— SCADA engineer &amp; full-stack developer.
    </p>
  );
}

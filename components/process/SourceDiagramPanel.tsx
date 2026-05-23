"use client";

interface SourceDiagramPanelProps {
  src: string | null;
  alt?: string;
}

export function SourceDiagramPanel({ src, alt = "Source P&ID / PFD" }: SourceDiagramPanelProps) {
  if (!src) return null;

  return (
    <div className="mt-3 shrink-0 border-t border-[var(--border)] pt-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
        Source drawing
      </h3>
      <div className="overflow-hidden rounded border border-[var(--border)] bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-40 w-full object-contain opacity-90" />
      </div>
    </div>
  );
}

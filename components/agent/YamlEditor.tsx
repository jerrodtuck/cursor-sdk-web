"use client";

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  title?: string;
}

export function YamlEditor({ value, onChange, error, title = "process-hmi.yaml" }: YamlEditorProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
          {title}
        </h2>
        {error ? (
          <span className="text-xs text-[var(--alarm-critical)]">Invalid</span>
        ) : (
          <span className="text-xs text-[var(--alarm-ok)]">Valid</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs leading-relaxed text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
      />
      {error ? (
        <p className="mt-2 shrink-0 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-[var(--alarm-critical)]">
          {error}
        </p>
      ) : (
        <p className="mt-2 shrink-0 text-xs text-[var(--foreground-muted)]">
          Edit YAML directly — preview updates as you type.
        </p>
      )}
    </div>
  );
}

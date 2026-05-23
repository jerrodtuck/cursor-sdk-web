import type { TagState } from "@/lib/process/mock-tags";
import { severityStroke } from "../symbols/shared";

interface InstrumentBubbleProps {
  x: number;
  y: number;
  tag: string;
  tagState?: TagState;
  /** Screen-space offset in SVG units (e.g. perpendicular to a pipe). */
  offsetX?: number;
  offsetY?: number;
}

export function InstrumentBubble({
  x,
  y,
  tag,
  tagState,
  offsetX = 0,
  offsetY = 0,
}: InstrumentBubbleProps) {
  const severity = tagState?.severity ?? "normal";
  const stroke = severityStroke(severity);
  const typeLabel = tag.split("-")[0] ?? tag;
  const valueText = tagState
    ? `${tagState.value.toFixed(1)}${tagState.unit ? ` ${tagState.unit}` : ""}`
    : null;

  return (
    <g transform={`translate(${x + offsetX}, ${y + offsetY})`}>
      <circle cx={0} cy={0} r={16} fill="var(--surface)" stroke={stroke} strokeWidth={1.5} />
      <text x={0} y={-3} textAnchor="middle" fill="var(--foreground)" fontSize={8} fontWeight={700}>
        {typeLabel}
      </text>
      <text x={0} y={6} textAnchor="middle" fill="var(--foreground-muted)" fontSize={6}>
        {tag}
      </text>
      {valueText ? (
        <g transform="translate(0, 22)">
          <rect
            x={-28}
            y={-8}
            width={56}
            height={14}
            rx={3}
            fill="var(--surface)"
            stroke={stroke}
            strokeWidth={1}
          />
          <text x={0} y={2} textAnchor="middle" fill={stroke} fontSize={8} fontFamily="monospace">
            {valueText}
          </text>
        </g>
      ) : null}
    </g>
  );
}

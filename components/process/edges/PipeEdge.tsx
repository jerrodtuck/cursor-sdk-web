import type { EdgeLayout } from "@/lib/process/layout";
import { pointAlongPolyline, pointsToPath } from "@/lib/process/layout";
import type { TagState } from "@/lib/process/mock-tags";
import { worstSeverity } from "@/lib/process/mock-tags";
import { severityStroke } from "../symbols/shared";
import { InstrumentBubble } from "../instruments/InstrumentBubble";

interface PipeEdgeProps {
  layout: EdgeLayout;
  tagStates: Record<string, TagState>;
}

export function PipeEdge({ layout, tagStates }: PipeEdgeProps) {
  const { edge, points } = layout;
  const severity = worstSeverity(tagStates, edge.tags);
  const stroke = severityStroke(severity);
  const d = pointsToPath(points);
  const last = points[points.length - 1];
  const prev = points[points.length - 2] ?? last;
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x);

  return (
    <g>
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} opacity={0.85} />
      {edge.kind === "process" ? (
        <polygon
          points="0,-4 8,0 0,4"
          fill={stroke}
          transform={`translate(${last.x}, ${last.y}) rotate(${(angle * 180) / Math.PI})`}
        />
      ) : null}
      {edge.instruments?.map((inst, index) => {
        const t = inst.attach?.t ?? 0.5;
        const pt = pointAlongPolyline(points, t);
        const nextT = Math.min(1, t + 0.02);
        const nextPt = pointAlongPolyline(points, nextT);
        const dx = nextPt.x - pt.x;
        const dy = nextPt.y - pt.y;
        const len = Math.hypot(dx, dy) || 1;
        const normalX = -dy / len;
        const normalY = dx / len;
        const side = index % 2 === 0 ? 1 : -1;
        const offset = 28 * side;
        return (
          <InstrumentBubble
            key={inst.tag}
            x={pt.x}
            y={pt.y}
            offsetX={normalX * offset}
            offsetY={normalY * offset}
            tag={inst.tag}
            tagState={tagStates[inst.tag]}
          />
        );
      })}
    </g>
  );
}

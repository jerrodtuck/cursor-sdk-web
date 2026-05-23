import type { NodeType } from "@/lib/process/schema";
import { symbolAccent, symbolFill, symbolStroke } from "./shared";

interface ProcessSymbolProps {
  type: NodeType;
  width: number;
  height: number;
  label: string;
  highlight?: boolean;
}

export function ProcessSymbol({ type, width, height, label, highlight }: ProcessSymbolProps) {
  const stroke = highlight ? symbolAccent : symbolStroke;

  return (
    <g>
      <SymbolShape type={type} width={width} height={height} stroke={stroke} />
      <text
        x={width / 2}
        y={height + 12}
        textAnchor="middle"
        fill="var(--foreground-muted)"
        fontSize={9}
        fontWeight={600}
        pointerEvents="none"
      >
        <tspan x={width / 2} dy={0}>
          {label.length > 14 ? `${label.slice(0, 12)}…` : label}
        </tspan>
      </text>
    </g>
  );
}

function SymbolShape({
  type,
  width,
  height,
  stroke,
}: {
  type: NodeType;
  width: number;
  height: number;
  stroke: string;
}) {
  const fill = symbolFill;

  switch (type) {
    case "vertical_tank":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <rect x={width * 0.15} y={height * 0.1} width={width * 0.7} height={height * 0.85} rx={4} />
          <ellipse cx={width / 2} cy={height * 0.1} rx={width * 0.35} ry={height * 0.06} />
        </g>
      );
    case "horizontal_drum":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <rect x={width * 0.05} y={height * 0.25} width={width * 0.9} height={height * 0.5} rx={height * 0.25} />
        </g>
      );
    case "distillation_column":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <rect x={width * 0.2} y={0} width={width * 0.6} height={height} />
          {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((t) => (
            <line key={t} x1={width * 0.2} y1={height * t} x2={width * 0.8} y2={height * t} />
          ))}
        </g>
      );
    case "furnace":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <rect x={0} y={height * 0.35} width={width * 0.75} height={height * 0.55} />
          <path d={`M ${width * 0.1} ${height * 0.55} L ${width * 0.65} ${height * 0.45} L ${width * 0.55} ${height * 0.7} Z`} />
          <rect x={width * 0.35} y={0} width={width * 0.12} height={height * 0.35} />
        </g>
      );
    case "cooling_tower":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <path d={`M ${width * 0.1} ${height} L ${width * 0.5} ${height * 0.15} L ${width * 0.9} ${height} Z`} />
          <circle cx={width / 2} cy={height * 0.12} r={width * 0.08} fill="none" />
          <line x1={width / 2} y1={height * 0.04} x2={width / 2} y2={height * 0.2} />
        </g>
      );
    case "reactor":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <rect x={width * 0.15} y={height * 0.1} width={width * 0.7} height={height * 0.8} rx={3} />
          <line x1={width / 2} y1={height * 0.15} x2={width / 2} y2={height * 0.85} />
          <line x1={width * 0.35} y1={height * 0.85} x2={width * 0.65} y2={height * 0.85} />
        </g>
      );
    case "boiler":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.4} />
          <path d={`M ${width * 0.35} ${height * 0.35} Q ${width * 0.5} ${height * 0.65} ${width * 0.65} ${height * 0.35}`} fill="none" />
        </g>
      );
    case "pump":
    case "vacuum_pump":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.42} />
          <path d={`M ${width / 2} ${height / 2} L ${width * 0.95} ${height * 0.35}`} fill="none" />
          {type === "vacuum_pump" ? (
            <circle cx={width * 0.7} cy={height * 0.35} r={width * 0.08} fill="none" />
          ) : null}
        </g>
      );
    case "heat_exchanger":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.45} />
          <line x1={width * 0.25} y1={height * 0.75} x2={width * 0.75} y2={height * 0.25} />
        </g>
      );
    case "valve":
      return (
        <g stroke={stroke} fill={fill} strokeWidth={1.5}>
          <path d={`M 0 ${height / 2} L ${width / 2} 0 L ${width / 2} ${height} Z`} />
          <path d={`M ${width} ${height / 2} L ${width / 2} 0 L ${width / 2} ${height} Z`} />
        </g>
      );
  }
}

import type { TagState } from "@/lib/process/mock-tags";
import type { ProcessHmiConfig } from "@/lib/process/schema";
import { resolveEdgeLayouts, resolveNodeLayouts } from "@/lib/process/layout";
import { InstrumentBubble } from "@/components/process/instruments/InstrumentBubble";
import { PipeEdge } from "@/components/process/edges/PipeEdge";
import { ProcessSymbol } from "@/components/process/symbols/ProcessSymbol";

interface CanvasSvgProps {
  width: number;
  height: number;
  pan: { x: number; y: number };
  zoom: number;
  tagStates: Record<string, TagState>;
  nodeLayouts: ReturnType<typeof resolveNodeLayouts>;
  edgeLayouts: ReturnType<typeof resolveEdgeLayouts>;
}

function renderInstrumentRow(
  nl: ReturnType<typeof resolveNodeLayouts>[number],
  tagStates: Record<string, TagState>,
) {
  const instruments = nl.node.instruments ?? [];
  const instrumentCount = instruments.length;

  return instruments.map((inst, i) => {
    const spread = instrumentCount > 1 ? (i - (instrumentCount - 1) / 2) * 72 : 0;
    const row = Math.floor(i / 3);
    const yOffset = -36 - row * 48;

    return (
      <InstrumentBubble
        key={inst.tag}
        x={nl.w / 2 + spread}
        y={yOffset}
        tag={inst.tag}
        tagState={tagStates[inst.tag]}
      />
    );
  });
}

export function CanvasSvg({
  width,
  height,
  pan,
  zoom,
  tagStates,
  nodeLayouts,
  edgeLayouts,
}: CanvasSvgProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ pointerEvents: "none" }}
    >
      <g
        transform={`translate(${pan.x} ${pan.y}) translate(${width / 2} ${height / 2}) scale(${zoom}) translate(${-width / 2} ${-height / 2})`}
      >
        <rect width={width} height={height} fill="transparent" />
        {edgeLayouts.map((el) => (
          <PipeEdge key={el.edge.id} layout={el} tagStates={tagStates} />
        ))}
        {nodeLayouts.map((nl) => (
          <g key={nl.id} transform={`translate(${nl.x}, ${nl.y})`}>
            <ProcessSymbol type={nl.node.type} width={nl.w} height={nl.h} label={nl.node.label} />
            {renderInstrumentRow(nl, tagStates)}
          </g>
        ))}
      </g>
    </svg>
  );
}

export function getCanvasDimensions(config: ProcessHmiConfig) {
  return config.diagram.canvas;
}

import { getSymbolDefaults, resolvePortName } from "./ports";
import type { ProcessEdge, ProcessHmiConfig, ProcessNode } from "./schema";

export interface Point {
  x: number;
  y: number;
}

export interface NodeLayout {
  id: string;
  node: ProcessNode;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EdgeLayout {
  edge: ProcessEdge;
  points: Point[];
}

export function resolveNodeLayouts(config: ProcessHmiConfig): NodeLayout[] {
  const { width, height } = config.diagram.canvas;

  return config.nodes.map((node) => {
    const defaults = getSymbolDefaults(node.type);
    const w = (node.size?.w ?? defaults.w) * width;
    const h = (node.size?.h ?? defaults.h) * height;
    const x = node.pos.x * width - w / 2;
    const y = node.pos.y * height - h / 2;
    return { id: node.id, node, x, y, w, h };
  });
}

export function resolvePortPoint(
  layouts: NodeLayout[],
  nodeId: string,
  portName: string,
): Point | null {
  const layout = layouts.find((l) => l.id === nodeId);
  if (!layout) return null;

  const resolved = resolvePortName(layout.node.type, portName);
  const port = getSymbolDefaults(layout.node.type).ports[resolved];
  if (!port) return null;

  return {
    x: layout.x + port.x * layout.w,
    y: layout.y + port.y * layout.h,
  };
}

/** Simple 3-segment orthogonal route between two ports */
export function routeEdge(from: Point, to: Point): Point[] {
  const midX = (from.x + to.x) / 2;
  return [
    from,
    { x: midX, y: from.y },
    { x: midX, y: to.y },
    to,
  ];
}

export function resolveEdgeLayouts(
  config: ProcessHmiConfig,
  nodeLayouts: NodeLayout[],
): EdgeLayout[] {
  return config.edges
    .map((edge) => {
      const from = resolvePortPoint(nodeLayouts, edge.from.node, edge.from.port);
      const to = resolvePortPoint(nodeLayouts, edge.to.node, edge.to.port);
      if (!from || !to) return null;
      return { edge, points: routeEdge(from, to) };
    })
    .filter((e): e is EdgeLayout => e !== null);
}

export function pointAlongPolyline(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const segments: { a: Point; b: Point; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, len });
    total += len;
  }

  let target = t * total;
  for (const seg of segments) {
    if (target <= seg.len) {
      const ratio = seg.len === 0 ? 0 : target / seg.len;
      return {
        x: seg.a.x + (seg.b.x - seg.a.x) * ratio,
        y: seg.a.y + (seg.b.y - seg.a.y) * ratio,
      };
    }
    target -= seg.len;
  }

  return points[points.length - 1];
}

export function polylineLength(points: Point[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
  }
  return len;
}

export function pointsToPath(points: Point[]): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

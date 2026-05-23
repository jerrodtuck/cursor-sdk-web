import type { NodeType } from "./schema";

export interface Port {
  x: number;
  y: number;
}

export interface SymbolDefaults {
  w: number;
  h: number;
  ports: Record<string, Port>;
}

const DEFAULTS: Record<NodeType, SymbolDefaults> = {
  vertical_tank: {
    w: 0.06,
    h: 0.16,
    ports: { inlet: { x: 0, y: 0.7 }, outlet: { x: 1, y: 0.7 } },
  },
  horizontal_drum: {
    w: 0.08,
    h: 0.06,
    ports: { inlet: { x: 0, y: 0.5 }, outlet: { x: 1, y: 0.5 } },
  },
  distillation_column: {
    w: 0.05,
    h: 0.45,
    ports: {
      feed: { x: 0, y: 0.55 },
      top: { x: 0.5, y: 0 },
      bottom: { x: 0.5, y: 1 },
      side: { x: 1, y: 0.45 },
    },
  },
  furnace: {
    w: 0.1,
    h: 0.2,
    ports: { inlet: { x: 0, y: 0.75 }, outlet: { x: 1, y: 0.5 } },
  },
  cooling_tower: {
    w: 0.12,
    h: 0.12,
    ports: { inlet: { x: 0, y: 0.8 }, outlet: { x: 1, y: 0.8 } },
  },
  reactor: {
    w: 0.07,
    h: 0.14,
    ports: { inlet: { x: 0, y: 0.5 }, outlet: { x: 1, y: 0.5 } },
  },
  boiler: {
    w: 0.06,
    h: 0.06,
    ports: { inlet: { x: 0, y: 0.5 }, outlet: { x: 1, y: 0.5 } },
  },
  pump: {
    w: 0.035,
    h: 0.035,
    ports: { inlet: { x: 0, y: 0.5 }, outlet: { x: 1, y: 0.5 } },
  },
  vacuum_pump: {
    w: 0.05,
    h: 0.05,
    ports: { inlet: { x: 0, y: 0.5 }, outlet: { x: 1, y: 0.5 } },
  },
  heat_exchanger: {
    w: 0.04,
    h: 0.04,
    ports: { inlet: { x: 0, y: 0.5 }, outlet: { x: 1, y: 0.5 } },
  },
  valve: {
    w: 0.025,
    h: 0.025,
    ports: { inlet: { x: 0, y: 0.5 }, outlet: { x: 1, y: 0.5 } },
  },
};

export function getSymbolDefaults(type: NodeType): SymbolDefaults {
  return DEFAULTS[type];
}

export function resolvePortName(type: NodeType, requested: string): string {
  const ports = DEFAULTS[type].ports;
  if (requested in ports) return requested;
  if (requested === "inlet" && "feed" in ports) return "feed";
  if (requested === "outlet" && "top" in ports) return "top";
  return Object.keys(ports)[0] ?? "inlet";
}

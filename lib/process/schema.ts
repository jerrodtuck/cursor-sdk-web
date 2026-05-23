import { z } from "zod";

export const nodeTypes = [
  "vertical_tank",
  "horizontal_drum",
  "distillation_column",
  "furnace",
  "cooling_tower",
  "reactor",
  "boiler",
  "pump",
  "vacuum_pump",
  "heat_exchanger",
  "valve",
] as const;

export const edgeKinds = ["process", "utility", "instrument"] as const;

export const instrumentTypes = [
  "PT",
  "TT",
  "FT",
  "LT",
  "AT",
  "PDT",
  "FIC",
  "LIC",
  "TIC",
  "XV",
  "PCV",
] as const;

export const alarmSchema = z.object({
  lo: z.number().optional(),
  loLo: z.number().optional(),
  hi: z.number().optional(),
  hiHi: z.number().optional(),
});

export const posSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const sizeSchema = z.object({
  w: z.number().min(0.01).max(1),
  h: z.number().min(0.01).max(1),
});

export const portRefSchema = z.object({
  node: z.string().min(1),
  port: z.string().min(1),
});

export const instrumentSchema = z.object({
  tag: z.string().min(1),
  type: z.string().min(1),
  role: z.string().optional(),
  unit: z.string().optional(),
  attach: z.object({ t: z.number().min(0).max(1) }).optional(),
});

export const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(nodeTypes),
  label: z.string().min(1),
  pos: posSchema,
  size: sizeSchema.optional(),
  tags: z.array(z.string()).optional(),
  instruments: z.array(instrumentSchema).optional(),
});

export const edgeSchema = z.object({
  id: z.string().min(1),
  from: portRefSchema,
  to: portRefSchema,
  kind: z.enum(edgeKinds).default("process"),
  tags: z.array(z.string()).optional(),
  instruments: z.array(instrumentSchema).optional(),
});

export const diagramSchema = z.object({
  title: z.string().min(1),
  source: z.string().optional(),
  canvas: z
    .object({
      width: z.number().int().min(400).default(1200),
      height: z.number().int().min(300).default(700),
    })
    .default({ width: 1200, height: 700 }),
});

export const processHmiConfigSchema = z.object({
  diagram: diagramSchema,
  nodes: z.array(nodeSchema).min(1),
  edges: z.array(edgeSchema),
  alarms: z.record(z.string(), alarmSchema).optional(),
});

export type NodeType = (typeof nodeTypes)[number];
export type EdgeKind = (typeof edgeKinds)[number];
export type AlarmLimits = z.infer<typeof alarmSchema>;
export type ProcessNode = z.infer<typeof nodeSchema>;
export type ProcessEdge = z.infer<typeof edgeSchema>;
export type ProcessInstrument = z.infer<typeof instrumentSchema>;
export type ProcessHmiConfig = z.infer<typeof processHmiConfigSchema>;

import type { AlarmLimits, ProcessHmiConfig, ProcessInstrument } from "./schema";

export type AlarmSeverity = "normal" | "lo" | "loLo" | "hi" | "hiHi";

export interface TagState {
  tag: string;
  value: number;
  unit?: string;
  severity: AlarmSeverity;
}

const DEFAULT_RANGES: Record<string, { min: number; max: number; unit?: string }> = {
  PT: { min: 0, max: 200, unit: "psig" },
  PDT: { min: 0, max: 50, unit: "psi" },
  LT: { min: 0, max: 100, unit: "%" },
  FT: { min: 0, max: 500, unit: "gpm" },
  TT: { min: 40, max: 400, unit: "°F" },
  AT: { min: 0, max: 100, unit: "%" },
};

function tagPrefix(tag: string): string {
  const letters = tag.split("-")[0]?.toUpperCase() ?? "PT";
  return letters.length > 2 ? letters.slice(0, 3) : letters;
}

function defaultRangeForTag(tag: string) {
  const prefix = tagPrefix(tag);
  return DEFAULT_RANGES[prefix] ?? DEFAULT_RANGES.PT;
}

function hashSeed(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function evaluateAlarm(value: number, alarms?: AlarmLimits): AlarmSeverity {
  if (alarms?.hiHi !== undefined && value >= alarms.hiHi) return "hiHi";
  if (alarms?.hi !== undefined && value >= alarms.hi) return "hi";
  if (alarms?.loLo !== undefined && value <= alarms.loLo) return "loLo";
  if (alarms?.lo !== undefined && value <= alarms.lo) return "lo";
  return "normal";
}

export function simulateTagValue(tag: string, tick: number): number {
  const range = defaultRangeForTag(tag);
  const seed = hashSeed(tag);
  const wave = Math.sin(tick / 8 + seed * 0.01);
  const drift = Math.sin(tick / 40 + seed * 0.003) * 0.15;
  const midpoint = (range.min + range.max) / 2;
  const amplitude = (range.max - range.min) * (0.25 + drift);
  return Math.round((midpoint + wave * amplitude) * 10) / 10;
}

function collectInstruments(config: ProcessHmiConfig): ProcessInstrument[] {
  const instruments: ProcessInstrument[] = [];
  for (const node of config.nodes) {
    if (node.instruments) instruments.push(...node.instruments);
    if (node.tags) {
      for (const tag of node.tags) {
        if (!instruments.some((i) => i.tag === tag)) {
          instruments.push({ tag, type: tagPrefix(tag) });
        }
      }
    }
  }
  for (const edge of config.edges) {
    if (edge.instruments) instruments.push(...edge.instruments);
    if (edge.tags) {
      for (const tag of edge.tags) {
        if (!instruments.some((i) => i.tag === tag)) {
          instruments.push({ tag, type: tagPrefix(tag) });
        }
      }
    }
  }
  return instruments;
}

export function buildTagStates(
  config: ProcessHmiConfig,
  tick: number,
): Record<string, TagState> {
  const instruments = collectInstruments(config);
  const states: Record<string, TagState> = {};

  for (const inst of instruments) {
    if (states[inst.tag]) continue;
    const range = defaultRangeForTag(inst.tag);
    const value = simulateTagValue(inst.tag, tick);
    states[inst.tag] = {
      tag: inst.tag,
      value,
      unit: inst.unit ?? range.unit,
      severity: evaluateAlarm(value, config.alarms?.[inst.tag]),
    };
  }

  return states;
}

export function activeAlarms(states: Record<string, TagState>): TagState[] {
  return Object.values(states).filter((s) => s.severity !== "normal");
}

export function worstSeverity(states: Record<string, TagState>, tags?: string[]): AlarmSeverity {
  if (!tags?.length) return "normal";
  const order: AlarmSeverity[] = ["hiHi", "loLo", "hi", "lo", "normal"];
  let worst: AlarmSeverity = "normal";
  for (const tag of tags) {
    const sev = states[tag]?.severity ?? "normal";
    if (order.indexOf(sev) < order.indexOf(worst)) worst = sev;
  }
  return worst;
}

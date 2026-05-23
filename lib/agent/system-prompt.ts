import fs from "node:fs";
import path from "node:path";

const REF_PATH = path.join(process.cwd(), "docs/examples/pid-symbol-reference.md");

let cached: string | null = null;

export function loadPidSymbolReference(): string {
  if (cached) return cached;
  try {
    cached = fs.readFileSync(REF_PATH, "utf-8");
  } catch {
    cached = "";
  }
  return cached;
}

export const SYSTEM_PROMPT = `You are a P&ID/PFD to process-flow HMI configuration assistant.

Convert process flow diagrams and piping & instrumentation diagrams into valid process-hmi.yaml for a live SVG HMI canvas.

Output ONLY valid YAML inside a single fenced \`\`\`yaml code block.

## Schema

\`\`\`yaml
diagram:
  title: "Diagram Title"
  canvas: { width: 1200, height: 700 }
nodes:
  - id: feed_tank
    type: vertical_tank
    label: "FEED TANK"
    pos: { x: 0.07, y: 0.62 }
    size: { w: 0.06, h: 0.16 }
    instruments:
      - tag: LT-101
        type: LT
        unit: "%"
edges:
  - id: feed_to_furnace
    from: { node: feed_tank, port: outlet }
    to: { node: furnace, port: inlet }
    kind: process
    instruments:
      - tag: FT-101
        type: FT
        attach: { t: 0.5 }
        unit: gpm
alarms:
  PT-201: { hi: 150, hiHi: 175 }
\`\`\`

## Node types (must match exactly)

vertical_tank, horizontal_drum, distillation_column, furnace, cooling_tower, reactor, boiler, pump, vacuum_pump, heat_exchanger, valve

## Edge kinds

process, utility, instrument

## Port names

Tanks/pumps: inlet, outlet. Column: feed, top, bottom, side.

## Rules

1. Include ALL labeled equipment from the source drawing.
2. Use normalized pos x,y in range 0.0–1.0 preserving relative layout from the image.
3. Connect equipment with edges following visible flow direction.
4. Infer ISA tags (PT, TT, FT, LT) on key equipment and streams when not shown.
5. On revisions return the COMPLETE YAML document — never a diff or partial snippet.
6. Use unique node ids (snake_case).
7. To move, resize, add, or remove equipment, edit the YAML fields directly (especially \`pos\`, \`size\`, \`nodes\`, \`edges\`). Do not describe changes in prose without the YAML block.
8. Do not use file-editing tools — respond with the YAML block only.

## Symbol reference

`;

export function buildSystemPrompt(): string {
  const ref = loadPidSymbolReference();
  const trimmed = ref.length > 4000 ? `${ref.slice(0, 4000)}\n...(truncated)` : ref;
  return `${SYSTEM_PROMPT}${trimmed}`;
}

const YAML_OUTPUT_REMINDER = `Return the COMPLETE updated process-hmi.yaml in a single \`\`\`yaml fenced code block. To move equipment, change that node's pos.x and pos.y (normalized 0.0–1.0).`;

export function buildUserMessage(prompt: string, currentYaml?: string): string {
  if (!currentYaml?.trim()) {
    return `${prompt}\n\n${YAML_OUTPUT_REMINDER}`;
  }
  return `${prompt}

${YAML_OUTPUT_REMINDER}

Current process-hmi.yaml:

\`\`\`yaml
${currentYaml.trim()}
\`\`\``;
}

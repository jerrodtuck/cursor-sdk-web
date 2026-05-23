# Pad HMI Designer — Product Requirements Document

## Problem & Vision

Engineers and operators rely on HMIs to monitor industrial processes. Creating these screens from P&ID (Piping and Instrumentation Diagram) and PFD (Process Flow Diagram) documentation is traditionally manual — mapping equipment, piping, and instrument tags into SCADA or DCS graphics.

**This demo** shows how the Cursor SDK can turn uploaded drawings into live process-flow HMIs: vision extraction → validated YAML → SVG canvas with simulated tag values and alarms.

---

## Site structure

| Route | Purpose |
|-------|---------|
| `/` | Landing page — SDK overview, doc links, setup help |
| `/demo` | P&ID → process-flow HMI designer |

Agent chat requires a connected API key (HttpOnly cookie on hosted demo, optional `.env.local` when running locally). Fixture preview works without a key.

---

## Goals

| Goal | Description |
|------|-------------|
| P&ID/PFD upload | PNG, JPEG, WebP, PDF (client-side rasterize) |
| Vision extraction | Agent returns `process-hmi.yaml` from drawing |
| SVG process-flow HMI | Equipment symbols, piping, instrument bubbles |
| Live mock tags | Simulated values and alarm evaluation |
| Streaming agent chat | Multi-turn refinement via `Agent.resume` |
| Secure BYOK | HttpOnly cookie; no deployer API key in production |

## Non-Goals

- Full ISO 10628 symbol library or CAD fidelity
- Real SCADA / OPC tag binding
- Cloud agent runtime (Phase 3)
- Persisting designs to database

---

## process-hmi.yaml DSL

Schema: [`lib/process/schema.ts`](lib/process/schema.ts)

```yaml
diagram:
  title: "PFD Sample"
  canvas: { width: 1200, height: 700 }
nodes:
  - id: feed_tank
    type: vertical_tank
    label: "FEED TANK"
    pos: { x: 0.07, y: 0.62 }
edges:
  - id: feed_to_furnace
    from: { node: feed_tank, port: outlet }
    to: { node: furnace, port: inlet }
    kind: process
alarms:
  PT-201: { hi: 150, hiHi: 175 }
```

**Node types:** `vertical_tank`, `horizontal_drum`, `distillation_column`, `furnace`, `cooling_tower`, `reactor`, `boiler`, `pump`, `vacuum_pump`, `heat_exchanger`, `valve`

Symbol reference: [`docs/examples/pid-symbol-reference.md`](docs/examples/pid-symbol-reference.md)

---

## Technical architecture

| Concern | Approach |
|---------|----------|
| Ingest | Client upload → base64 image; PDF via pdf.js rasterize |
| Agent | `@cursor/sdk` local runtime, `images[]` on user message |
| Output | Fenced YAML → Zod validate → SVG render |
| Auth | HttpOnly cookie via `POST /api/connect` |
| Layout | Normalized 0–1 positions; Manhattan edge routing |

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | process-hmi DSL, SVG canvas, fixture, upload | **Current** |
| 2 | FastAPI + Python SDK backend | Planned |
| 3 | Cloud agents, export formats | Future |

---

## Demo script

1. Open `/demo` — PFD sample canvas with mock tags
2. Upload PNG or PDF → Generate HMI
3. Chat: refine alarms and tags
4. Edit YAML manually

# P&ID / PFD Symbol Reference

Condensed reference for agent-generated `process-hmi.yaml` configs. Based on ISA 5.1 conventions and common oil & gas P&ID practice (Kimray-style guides).

## PFD vs P&ID

| Drawing | Shows | HMI focus |
|---------|-------|-----------|
| **PFD** (Process Flow Diagram) | Major equipment, flow direction, material balance | Equipment status, stream flows, key temperatures/pressures |
| **P&ID** (Piping & Instrumentation) | PFD detail + all pipes, valves, instrument bubbles | Full tag coverage, valve positions, alarms |

This demo supports both: equipment nodes from PFDs, instrument bubbles from P&IDs.

## Equipment → `node.type` mapping

| Drawing symbol | `node.type` |
|----------------|-------------|
| Vertical tank / vessel | `vertical_tank` |
| Horizontal drum / vessel | `horizontal_drum` |
| Distillation column / tower | `distillation_column` |
| Furnace / fired heater | `furnace` |
| Cooling tower | `cooling_tower` |
| Agitated reactor | `reactor` |
| Boiler / reboiler | `boiler` |
| Centrifugal pump | `pump` |
| Vacuum pump / ejector | `vacuum_pump` |
| Heat exchanger (shell/tube) | `heat_exchanger` |
| Gate / block valve | `valve` |

## ISA first-letter instrument codes

| Letter | Measured variable | Examples |
|--------|-------------------|----------|
| **P** | Pressure | PT (transmitter), PI (indicator), PDT (differential) |
| **T** | Temperature | TT, TI, TIT |
| **F** | Flow | FT, FI, FIT, FC (controller) |
| **L** | Level | LT, LI, LIC, LIT |
| **A** | Analysis | AT, AI |
| **V** | Vibration | VT |
| **Z** | Position / dimension | ZT ( valve position) |

## Common suffix letters

| Suffix | Meaning |
|--------|---------|
| T | Transmitter (analog signal to control system) |
| I | Indicator (local display) |
| C | Controller |
| V | Control valve |
| Y | Relay / compute / convert |
| S | Switch |
| A | Alarm |

## Tag numbering

Format: `{TYPE}-{LOOP}` e.g. `PT-101`, `FT-201`, `LT-301`

- Loop number ties instrument to equipment area (100s = feed, 200s = column, etc.)
- Use consistent numbering within a generated diagram

## Edge kinds

| `kind` | Use |
|--------|-----|
| `process` | Main material flow (solid line, arrow) |
| `utility` | Steam, cooling water, fuel gas |
| `instrument` | Instrument signal line (dashed in P&ID; optional in demo) |

## Layout coordinates

- `pos.x`, `pos.y` are normalized **0.0–1.0** relative to canvas
- Origin top-left; preserve relative positions from source drawing
- `size.w`, `size.h` optional; defaults per symbol type

## Alarm limits (optional `alarms` map)

```yaml
alarms:
  PT-101: { hi: 150, hiHi: 175 }
  LT-101: { lo: 10, loLo: 5, hi: 90, hiHi: 95 }
```

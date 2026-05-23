# P&ID → Process Flow HMI — Cursor SDK Demo

Open-source demo by [Jerrod Tuck](https://jerrodtuck.com) for the [Cursor SDK](https://cursor.com/docs/sdk/typescript) (`@cursor/sdk`). Upload a P&ID or PFD drawing and generate a live SVG process-flow HMI with simulated instrument values.

**Links:** [GitHub](https://github.com/jerrodtuck/cursor-sdk-web) · [@jerrodtuck on X](https://x.com/jerrodtuck) · [Live demo](/demo)

See the full product spec in [docs/PRD.md](docs/PRD.md).

## Site routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page — why, SDK doc links, setup help |
| `/demo` | P&ID → process-flow HMI designer |

## What it demonstrates

- **Vision extraction** — Upload PNG/JPEG/PDF; agent returns `process-hmi.yaml`
- **Local Cursor SDK** — `Agent.create` / `Agent.resume` with SSE streaming
- **Structured output** — YAML config validated with Zod, rendered as SVG canvas
- **Live mock tags** — ISA instrument bubbles with alarm states
- **Secure BYOK** — HttpOnly cookie for hosted demos; `.env.local` for local dev

## Prerequisites

- Node.js 20+
- [Cursor API key](https://cursor.com/dashboard/integrations) (paste in demo UI for generation; preview works without)

## Quick start

```bash
npm install
cp .env.local.example .env.local
# Optional for local dev: uncomment CURSOR_API_KEY in .env.local

npm run dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo).

**Hosted demo:** connect your API key on the demo page (HttpOnly cookie).

**Local clone (most secure):** optional `CURSOR_API_KEY` in `.env.local`.

## Demo script

1. Open `/demo` — PFD sample renders as SVG with live mock tags
2. Compare source PNG alongside the generated canvas
3. Upload `docs/examples/pid_example.png` or a PDF → Generate HMI
4. Chat: *"Add hi-hi alarm on PT-301 at 150 psig"*
5. Edit YAML manually — validation errors appear inline

## Project layout

```
app/demo/             Interactive designer
app/api/agent/        POST /api/agent — Cursor SDK + SSE + vision
app/api/connect/      HttpOnly API key connect
components/process/   SVG canvas, symbols, upload
fixtures/pfd-sample.yaml
lib/process/          process-hmi DSL schema, layout, mock tags
docs/examples/        pid_example.png, symbol reference, Kimray PDF
```

## API routes

`POST /api/agent` accepts:

```json
{
  "prompt": "Convert this P&ID into process-hmi.yaml",
  "agentId": "optional",
  "currentYaml": "optional",
  "image": { "data": "base64...", "mimeType": "image/png" }
}
```

`POST /api/connect` — validate and store API key in HttpOnly cookie.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

import { getSymbolDefaults } from "./ports";

/** Extra space below symbol for equipment label text. */
const LABEL_PAD = 16;

/** Space above symbol for instrument bubbles and live values. */
const INSTRUMENT_PAD = 52;

const NODE_PAD = 10;

export interface DeoverlapLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  node: { instruments?: unknown[] };
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function nodeBounds(layout: DeoverlapLayout): Rect {
  const instrumentCount = layout.node.instruments?.length ?? 0;
  const topPad = instrumentCount > 0 ? INSTRUMENT_PAD : NODE_PAD;

  return {
    left: layout.x - NODE_PAD,
    top: layout.y - topPad,
    right: layout.x + layout.w + NODE_PAD,
    bottom: layout.y + layout.h + LABEL_PAD,
  };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function separateRects(a: Rect, b: Rect): { dx: number; dy: number } {
  const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

  if (overlapX <= 0 || overlapY <= 0) {
    return { dx: 0, dy: 0 };
  }

  if (overlapX < overlapY) {
    const push = overlapX / 2 + 2;
    const aCenter = (a.left + a.right) / 2;
    const bCenter = (b.left + b.right) / 2;
    return aCenter < bCenter ? { dx: -push, dy: 0 } : { dx: push, dy: 0 };
  }

  const push = overlapY / 2 + 2;
  const aCenter = (a.top + a.bottom) / 2;
  const bCenter = (b.top + b.bottom) / 2;
  return aCenter < bCenter ? { dx: 0, dy: -push } : { dx: 0, dy: push };
}

/** Shrink default symbol sizes when the diagram has many nodes. */
export function densityScale(nodeCount: number): number {
  if (nodeCount <= 10) return 1;
  if (nodeCount <= 16) return 0.88;
  if (nodeCount <= 22) return 0.78;
  return 0.68;
}

/**
 * Push overlapping node layouts apart while keeping them on the canvas.
 * Mutates layout x/y in place and returns the same array.
 */
export function deoverlapNodeLayouts<T extends DeoverlapLayout>(
  layouts: T[],
  canvasWidth: number,
  canvasHeight: number,
): T[] {
  if (layouts.length < 2) return layouts;

  const maxTop = INSTRUMENT_PAD;
  const maxBottom = canvasHeight - LABEL_PAD;

  for (let iter = 0; iter < 80; iter++) {
    let moved = false;

    for (let i = 0; i < layouts.length; i++) {
      for (let j = i + 1; j < layouts.length; j++) {
        const a = nodeBounds(layouts[i]);
        const b = nodeBounds(layouts[j]);
        if (!rectsOverlap(a, b)) continue;

        const { dx, dy } = separateRects(a, b);
        layouts[i].x += dx;
        layouts[i].y += dy;
        layouts[j].x -= dx;
        layouts[j].y -= dy;
        moved = true;
      }
    }

    for (const layout of layouts) {
      const minY = maxTop;
      const maxY = maxBottom - layout.h;
      layout.x = Math.max(0, Math.min(canvasWidth - layout.w, layout.x));
      layout.y = Math.max(minY, Math.min(maxY, layout.y));
    }

    if (!moved) break;
  }

  return layouts;
}

export function scaledSymbolSize(
  type: Parameters<typeof getSymbolDefaults>[0],
  nodeCount: number,
  override?: { w?: number; h?: number },
): { w: number; h: number } {
  const defaults = getSymbolDefaults(type);
  const scale = densityScale(nodeCount);
  return {
    w: override?.w ?? defaults.w * scale,
    h: override?.h ?? defaults.h * scale,
  };
}

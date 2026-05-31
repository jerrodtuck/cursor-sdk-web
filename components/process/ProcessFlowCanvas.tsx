"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CanvasSvg, getCanvasDimensions } from "@/components/process/CanvasSvg";
import { useMockTagTick } from "@/components/process/usePanZoom";
import { resolveEdgeLayouts, resolveNodeLayouts } from "@/lib/process/layout";
import { activeAlarms, buildTagStates, type TagState } from "@/lib/process/mock-tags";
import type { ProcessHmiConfig } from "@/lib/process/schema";

interface ProcessFlowCanvasProps {
  config: ProcessHmiConfig | null;
}

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function AlarmBanner({ mounted, alarms }: { mounted: boolean; alarms: Array<{ tag: string }> }) {
  if (mounted && alarms.length > 0) {
    return (
      <div className="shrink-0 rounded border border-[var(--alarm-critical)]/50 bg-red-950/30 px-2 py-1 text-xs text-[var(--alarm-critical)]">
        {alarms.length} active alarm{alarms.length > 1 ? "s" : ""}: {alarms.map((a) => a.tag).join(", ")}
      </div>
    );
  }

  return (
    <div className="shrink-0 rounded border border-[var(--alarm-ok)]/40 bg-emerald-950/20 px-2 py-1 text-xs text-[var(--alarm-ok)]">
      {mounted ? "All tags normal" : "Loading live tags…"}
    </div>
  );
}

function EmptyCanvasState() {
  return (
    <div className="hmi-canvas-shell flex h-full min-h-0 items-center justify-center rounded-lg border p-4 text-sm text-[var(--foreground-muted)]">
      Valid process-hmi.yaml required
    </div>
  );
}

function useCanvasModel(config: ProcessHmiConfig | null, mounted: boolean, tick: number) {
  const tagStates = useMemo<Record<string, TagState>>(
    () => (config && mounted ? buildTagStates(config, tick) : {}),
    [config, mounted, tick],
  );
  const alarms = useMemo(() => activeAlarms(tagStates), [tagStates]);
  const nodeLayouts = useMemo(() => (config ? resolveNodeLayouts(config) : []), [config]);
  const edgeLayouts = useMemo(
    () => (config ? resolveEdgeLayouts(config, nodeLayouts) : []),
    [config, nodeLayouts],
  );

  return { tagStates, alarms, nodeLayouts, edgeLayouts };
}

export function ProcessFlowCanvas({ config }: ProcessFlowCanvasProps) {
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const tick = useMockTagTick(mounted);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const { width, height } = config ? getCanvasDimensions(config) : { width: 1200, height: 700 };
  const model = useCanvasModel(config, mounted, tick);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(2.5, Math.max(0.4, z - e.deltaY * 0.001)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [config?.diagram.title]);

  const screenToSvgScale = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect?.width) return 1;
    return width / rect.width;
  }, [width]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragging.current = true;
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      const scale = screenToSvgScale();
      setPan((p) => ({ x: p.x + (dx * scale) / zoom, y: p.y + (dy * scale) / zoom }));
    },
    [screenToSvgScale, zoom],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  if (!config) return <EmptyCanvasState />;

  return (
    <div className="hmi-canvas-shell flex h-full min-h-0 flex-col gap-2 rounded-lg border p-2">
      <div className="flex shrink-0 items-center justify-between text-xs text-[var(--foreground-muted)]">
        <span>{config.diagram.title}</span>
        <span>Scroll to zoom · drag to pan</span>
      </div>

      <AlarmBanner mounted={mounted} alarms={model.alarms} />

      <div
        key={config.diagram.title}
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-[var(--canvas-background)]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
      >
        {!mounted ? (
          <div className="flex h-full min-h-[200px] items-center justify-center text-xs text-[var(--foreground-muted)]">
            Loading preview…
          </div>
        ) : (
          <CanvasSvg
            width={width}
            height={height}
            pan={pan}
            zoom={zoom}
            tagStates={model.tagStates}
            nodeLayouts={model.nodeLayouts}
            edgeLayouts={model.edgeLayouts}
          />
        )}
      </div>
    </div>
  );
}

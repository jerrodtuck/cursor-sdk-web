"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { PipeEdge } from "@/components/process/edges/PipeEdge";
import { InstrumentBubble } from "@/components/process/instruments/InstrumentBubble";
import { ProcessSymbol } from "@/components/process/symbols/ProcessSymbol";
import {
  resolveEdgeLayouts,
  resolveNodeLayouts,
} from "@/lib/process/layout";
import {
  activeAlarms,
  buildTagStates,
  type TagState,
} from "@/lib/process/mock-tags";
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

export function ProcessFlowCanvas({ config }: ProcessFlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const [tick, setTick] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mounted) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [mounted]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(2.5, Math.max(0.4, z - e.deltaY * 0.001)));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mounted, config]);

  const tagStates = useMemo<Record<string, TagState>>(
    () => (config && mounted ? buildTagStates(config, tick) : {}),
    [config, mounted, tick],
  );

  const alarms = useMemo(() => activeAlarms(tagStates), [tagStates]);

  const nodeLayouts = useMemo(
    () => (config ? resolveNodeLayouts(config) : []),
    [config],
  );

  const edgeLayouts = useMemo(
    () => (config ? resolveEdgeLayouts(config, nodeLayouts) : []),
    [config, nodeLayouts],
  );

  const { width, height } = config?.diagram.canvas ?? { width: 1200, height: 700 };

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
      setPan((p) => ({
        x: p.x + (dx * scale) / zoom,
        y: p.y + (dy * scale) / zoom,
      }));
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

  if (!config) {
    return (
      <div className="hmi-canvas-shell flex h-full min-h-0 items-center justify-center rounded-lg border p-4 text-sm text-[var(--foreground-muted)]">
        Valid process-hmi.yaml required
      </div>
    );
  }

  return (
    <div className="hmi-canvas-shell flex h-full min-h-0 flex-col gap-2 rounded-lg border p-2">
      <div className="flex shrink-0 items-center justify-between text-xs text-[var(--foreground-muted)]">
        <span>{config.diagram.title}</span>
        <span>Scroll to zoom · drag to pan</span>
      </div>

      {mounted && alarms.length > 0 ? (
        <div className="shrink-0 rounded border border-[var(--alarm-critical)]/50 bg-red-950/30 px-2 py-1 text-xs text-[var(--alarm-critical)]">
          {alarms.length} active alarm{alarms.length > 1 ? "s" : ""}:{" "}
          {alarms.map((a) => a.tag).join(", ")}
        </div>
      ) : (
        <div className="shrink-0 rounded border border-[var(--alarm-ok)]/40 bg-emerald-950/20 px-2 py-1 text-xs text-[var(--alarm-ok)]">
          {mounted ? "All tags normal" : "Loading live tags…"}
        </div>
      )}

      <div
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
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: "none" }}
          >
            <g
              transform={`translate(${pan.x} ${pan.y}) translate(${width / 2} ${height / 2}) scale(${zoom}) translate(${-width / 2} ${-height / 2})`}
            >
              <rect width={width} height={height} fill="transparent" />
              {edgeLayouts.map((el) => (
                <PipeEdge key={el.edge.id} layout={el} tagStates={tagStates} />
              ))}
              {nodeLayouts.map((nl) => {
                const instruments = nl.node.instruments ?? [];
                const instrumentCount = instruments.length;

                return (
                  <g key={nl.id} transform={`translate(${nl.x}, ${nl.y})`}>
                    <ProcessSymbol
                      type={nl.node.type}
                      width={nl.w}
                      height={nl.h}
                      label={nl.node.label}
                    />
                    {instruments.map((inst, i) => {
                      const spread =
                        instrumentCount > 1
                          ? (i - (instrumentCount - 1) / 2) * 58
                          : 0;
                      return (
                        <InstrumentBubble
                          key={inst.tag}
                          x={nl.w / 2 + spread}
                          y={-36}
                          tag={inst.tag}
                          tagState={tagStates[inst.tag]}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import type { WorldPerfMetrics } from '../world/WorldEngine';

interface PerfOverlayProps {
  open: boolean;
  fpsRef: React.RefObject<HTMLSpanElement | null>;
  callsRef: React.RefObject<HTMLSpanElement | null>;
  trisRef: React.RefObject<HTMLSpanElement | null>;
  initialMetrics?: WorldPerfMetrics;
}

function formatTriangles(tris: number): string {
  return tris >= 1000 ? `${(tris / 1000).toFixed(1)}k tris` : `${tris} tris`;
}

export const PerfOverlay: React.FC<PerfOverlayProps> = ({
  open,
  fpsRef,
  callsRef,
  trisRef,
  initialMetrics,
}) => {
  if (!open) return null;

  const fpsText = `${initialMetrics?.fps ?? 60} FPS`;
  const callsText = `${initialMetrics?.drawCalls ?? 0} calls`;
  const trisText = formatTriangles(initialMetrics?.triangles ?? 0);

  return (
    <div
      data-testid="perf-diagnostics"
      className="fixed top-12 right-2.5 sm:top-16 sm:right-4 z-30 pointer-events-none rounded-lg border border-slate-300/20 px-3 py-1.5 text-[11px] font-mono text-slate-100 tabular-nums shadow-lg flex items-center gap-2.5"
      style={{ backgroundColor: 'rgba(13, 20, 34, 0.90)' }}
      aria-live="off"
    >
      <span ref={fpsRef} data-testid="perf-fps" className="text-emerald-400 font-semibold">
        {fpsText}
      </span>
      <span className="text-slate-500" aria-hidden="true">
        ·
      </span>
      <span ref={callsRef} data-testid="perf-calls" className="text-amber-300">
        {callsText}
      </span>
      <span className="text-slate-500" aria-hidden="true">
        ·
      </span>
      <span ref={trisRef} data-testid="perf-tris" className="text-sky-300">
        {trisText}
      </span>
    </div>
  );
};

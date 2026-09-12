"use client";

import { useMemo, useState, useRef } from "react";
import type { PricePoint } from "@/lib/mock-data";

const PERIODS = [
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "Inception", days: Infinity },
] as const;

export default function PerformanceChart({
  history,
}: {
  history: PricePoint[];
  benchmarkName?: string;
}) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["label"]>("90D");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const slice = useMemo(() => {
    const days = PERIODS.find((p) => p.label === period)!.days;
    return days === Infinity ? history : history.slice(-days - 1);
  }, [history, period]);

  const width = 640;
  const height = 240;
  const values = slice.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const startVal = slice[0].value;
  const currentPoint = hoverIndex !== null && slice[hoverIndex] ? slice[hoverIndex] : slice[slice.length - 1];
  const activeChangePct = ((currentPoint.value - startVal) / startVal) * 100;
  const positive = activeChangePct >= 0;
  const color = positive ? "var(--positive)" : "var(--negative)";

  const coords = useMemo(() => {
    return slice.map((p, i) => {
      const x = (i / (slice.length - 1)) * width;
      const y = height - ((p.value - min) / range) * (height - 32) - 16;
      return { x, y, ...p };
    });
  }, [slice, min, range]);

  const linePath = useMemo(
    () => `M${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" L")}`,
    [coords]
  );
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const idx = Math.round(ratio * (slice.length - 1));
    setHoverIndex(idx);
  }

  function handleMouseLeave() {
    setHoverIndex(null);
  }

  const activeCoord = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : coords[coords.length - 1];

  return (
    <div>
      {/* Top Header with live active point details, benchmark toggle, and period selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle/80 pb-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold tabular-nums text-foreground">
              ${currentPoint.value.toFixed(2)}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
                positive ? "bg-positive-soft text-positive border border-positive/20" : "bg-negative-soft text-negative border border-negative/20"
              }`}
            >
              {positive ? "+" : ""}
              {activeChangePct.toFixed(2)}%
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {currentPoint.date} {hoverIndex !== null ? "(hovered point)" : `(${period} view)`}
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-border-subtle bg-background p-1 text-xs">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setPeriod(p.label);
                setHoverIndex(null);
              }}
              className={`rounded-lg px-3 py-1 font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
                period === p.label
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart with interactive crosshair */}
      <div className="relative mt-4 cursor-crosshair">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="perf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Reference Gridlines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={width}
              y1={height * f}
              y2={height * f}
              stroke="var(--border-subtle)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area & Line */}
          <path d={areaPath} fill="url(#perf-fill)" stroke="none" />

          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />

          {/* Crosshair indicator */}
          {activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                x2={activeCoord.x}
                y1={0}
                y2={height}
                stroke="var(--foreground)"
                strokeOpacity="0.2"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="5"
                fill="var(--surface)"
                stroke={color}
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Low / High / Volatility Summary Bar */}
      <div className="mt-3 flex items-center justify-between border-t border-border-subtle/60 pt-3 text-[11px] text-muted">
        <div>
          <span>Period Low: </span>
          <span className="font-mono font-medium text-foreground">${min.toFixed(2)}</span>
        </div>
        <div>
          <span>Period High: </span>
          <span className="font-mono font-medium text-foreground">${max.toFixed(2)}</span>
        </div>
        <div>
          <span>Spread: </span>
          <span className="font-mono font-medium text-foreground">${(max - min).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}


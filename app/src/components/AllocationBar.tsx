"use client";

import { useState } from "react";
import type { Asset } from "@/lib/mock-data";
import { chartColor } from "@/lib/chart-colors";
import { ASSET_METADATA } from "@/lib/mock-data";
import { CompanyLogo } from "@/components/TickerChip";

export default function AllocationBar({
  assets,
  showLegend = true,
}: {
  assets: Asset[];
  showLegend?: boolean;
}) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  return (
    <div>
      {/* Proportional Segmented Bar */}
      <div className="flex h-3.5 w-full gap-[3px] overflow-hidden rounded-lg border border-border-subtle/50 bg-background p-0.5 shadow-2xs">
        {assets.map((a, i) => {
          const isHovered = hoveredSymbol === a.symbol;
          const isDimmed = hoveredSymbol !== null && !isHovered;
          return (
            <div
              key={a.symbol}
              onMouseEnter={() => setHoveredSymbol(a.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              className={`h-full rounded-sm transition-all duration-200 cursor-pointer ${
                isHovered ? "scale-y-125 shadow-sm" : isDimmed ? "opacity-40" : "opacity-100"
              }`}
              style={{ width: `${a.weightBps / 100}%`, backgroundColor: chartColor(i) }}
              title={`${a.name} (${a.symbol}) ${(a.weightBps / 100).toFixed(0)}%`}
            />
          );
        })}
      </div>

      {showLegend && (
        <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-2">
          {assets.map((a) => {
            const isHovered = hoveredSymbol === a.symbol;
            const meta = ASSET_METADATA[a.symbol];
            return (
              <li
                key={a.symbol}
                onMouseEnter={() => setHoveredSymbol(a.symbol)}
                onMouseLeave={() => setHoveredSymbol(null)}
                className={`flex items-center justify-between rounded-xl border border-border-subtle/80 bg-background/50 p-3 transition-all duration-150 cursor-pointer ${
                  isHovered
                    ? "border-accent bg-accent-soft/30 shadow-xs -translate-y-0.5"
                    : "hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo symbol={a.symbol} size={28} />
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground text-sm">{a.symbol}</span>
                      {meta?.sector && (
                        <span className="rounded bg-surface border border-border-subtle px-1.5 py-0.2 text-[10px] font-medium text-muted">
                          {meta.sector}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted truncate block">{a.name}</span>
                  </div>
                </div>

                <div className="text-right ml-3 shrink-0">
                  <span className="font-display font-bold text-sm text-foreground block">
                    {(a.weightBps / 100).toFixed(0)}%
                  </span>
                  {meta && (
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        meta.change24h >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      ${meta.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}



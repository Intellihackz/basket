"use client";

import { useState } from "react";
import type { Asset } from "@/lib/mock-data";
import { chartColor } from "@/lib/chart-colors";
import { findXStock } from "@/lib/xstocks/registry";
import { CompanyLogo } from "@/components/TickerChip";
import StockDetailModal from "@/components/StockDetailModal";

function ExternalLinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none">
      <path d="M3 1.5H8.5V7M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendGlyph({ positive }: { positive: boolean }) {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="shrink-0">
      <path
        d={positive ? "M5 1.5V8.5M5 1.5L1.5 5M5 1.5L8.5 5" : "M5 8.5V1.5M5 8.5L1.5 5M5 8.5L8.5 5"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatAssetReturn(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export default function AllocationBar({
  assets,
  showLegend = true,
  livePrices,
  assetReturns,
}: {
  assets: Asset[];
  showLegend?: boolean;
  /** symbol -> live USD price, e.g. from an index's hydrated `livePricesUsd` */
  livePrices?: Record<string, number>;
  /** symbol -> % return since this basket's publish snapshot, e.g. from `assetReturnsPct` */
  assetReturns?: Record<string, number | null>;
}) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<number | null>(null);

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
            const mint = a.mint || findXStock(a.symbol)?.mint;
            const livePrice = livePrices?.[a.symbol];
            const assetReturn = assetReturns?.[a.symbol] ?? null;
            return (
              <li
                key={a.symbol}
                onMouseEnter={() => setHoveredSymbol(a.symbol)}
                onMouseLeave={() => setHoveredSymbol(null)}
                onClick={() => {
                  setSelectedAsset({ ...a, mint });
                  setSelectedReturn(assetReturn);
                }}
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
                      {mint && (
                        <a
                          href={`https://solscan.io/token/${mint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border-subtle/80 bg-surface px-1.5 py-0.2 font-mono text-[10px] text-muted hover:border-foreground/20 hover:text-foreground transition-colors"
                          title={`Solana Token-2022 Mint: ${mint}`}
                        >
                          <span>{mint.slice(0, 4)}...{mint.slice(-4)}</span>
                          <ExternalLinkIcon className="h-2 w-2" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-muted truncate block">{a.name}</span>
                  </div>
                </div>

                <div className="text-right ml-3 shrink-0">
                  <span className="font-display font-bold text-sm text-foreground block">
                    {(a.weightBps / 100).toFixed(0)}%
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    {livePrice !== undefined && (
                      <span className="text-[11px] font-mono font-medium text-muted">${livePrice.toFixed(2)}</span>
                    )}
                    {assetReturn !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold ${
                          assetReturn >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        <TrendGlyph positive={assetReturn >= 0} />
                        {formatAssetReturn(assetReturn)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selectedAsset && (
        <StockDetailModal
          asset={selectedAsset}
          livePrice={livePrices?.[selectedAsset.symbol]}
          returnSincePublishPct={selectedReturn}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}



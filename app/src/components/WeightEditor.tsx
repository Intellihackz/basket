"use client";

import { useMemo, useState } from "react";
import { ASSET_METADATA } from "@/lib/mock-data";
import { chartColor } from "@/lib/chart-colors";
import { CompanyLogo } from "@/components/TickerChip";
import { searchXStocks, getPopularXStocks } from "@/lib/xstocks/registry";

export type DraftAsset = { symbol: string; name: string; weight: number };

const QUICK_STARTERS = [
  {
    label: "AI Hardware",
    assets: [
      { symbol: "NVDA", name: "NVIDIA Corp", weight: 40 },
      { symbol: "TSM", name: "Taiwan Semiconductor", weight: 30 },
      { symbol: "AMD", name: "Advanced Micro Devices", weight: 30 },
    ],
  },
  {
    label: "Mega Tech",
    assets: [
      { symbol: "AAPL", name: "Apple Inc", weight: 25 },
      { symbol: "MSFT", name: "Microsoft Corp", weight: 25 },
      { symbol: "GOOGL", name: "Alphabet Inc", weight: 25 },
      { symbol: "AMZN", name: "Amazon.com Inc", weight: 25 },
    ],
  },
  {
    label: "Space & Frontier",
    assets: [
      { symbol: "RKLB", name: "Rocket Lab USA", weight: 50 },
      { symbol: "GE", name: "GE Aerospace", weight: 30 },
      { symbol: "SPCX", name: "SpaceX", weight: 20 },
    ],
  },
  {
    label: "Crypto Proxies",
    assets: [
      { symbol: "MSTR", name: "MicroStrategy", weight: 40 },
      { symbol: "COIN", name: "Coinbase Global", weight: 35 },
      { symbol: "PLTR", name: "Palantir Tech", weight: 25 },
    ],
  },
];

export default function WeightEditor({
  assets,
  onChange,
}: {
  assets: DraftAsset[];
  onChange: (assets: DraftAsset[]) => void;
}) {
  const [query, setQuery] = useState("");

  const total = assets.reduce((sum, a) => sum + a.weight, 0);
  const isValid = assets.length > 0 && total === 100;
  const remaining = 100 - total;

  const results = useMemo(() => {
    const used = new Set(assets.map((a) => a.symbol.toUpperCase()));
    if (!query.trim()) {
      return getPopularXStocks()
        .filter((s) => !used.has(s.underlyingSymbol.toUpperCase()))
        .slice(0, 6);
    }
    return searchXStocks(query, 10).filter(
      (s) => !used.has(s.underlyingSymbol.toUpperCase()) && !used.has(s.symbol.toUpperCase())
    );
  }, [query, assets]);

  function addAsset(symbol: string, name: string) {
    const defaultWeight = assets.length === 0 ? 100 : Math.max(0, remaining);
    onChange([...assets, { symbol, name, weight: defaultWeight }]);
    setQuery("");
  }

  function updateWeight(symbol: string, weight: number) {
    const clamped = Math.max(0, Math.min(100, weight));
    onChange(assets.map((a) => (a.symbol === symbol ? { ...a, weight: clamped } : a)));
  }

  function removeAsset(symbol: string) {
    onChange(assets.filter((a) => a.symbol !== symbol));
  }

  function equalizeWeights() {
    if (assets.length === 0) return;
    const base = Math.floor(100 / assets.length);
    const remainder = 100 % assets.length;
    onChange(
      assets.map((a, i) => ({
        ...a,
        weight: base + (i < remainder ? 1 : 0),
      }))
    );
  }

  function distributeRemaining() {
    if (assets.length === 0 || remaining === 0) return;
    const perAsset = Math.floor(remaining / assets.length);
    const leftover = remaining % assets.length;
    onChange(
      assets.map((a, i) => ({
        ...a,
        weight: Math.max(0, a.weight + perAsset + (i < leftover ? 1 : 0)),
      }))
    );
  }

  return (
    <div>
      {/* Quick starter chips */}
      {assets.length === 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted">Or start with a curated template:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_STARTERS.map((qs) => (
              <button
                key={qs.label}
                type="button"
                onClick={() => onChange(qs.assets)}
                className="rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-accent hover:text-accent active:scale-95"
              >
                + {qs.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Asset Search */}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 798 tokenized equities (e.g. NVDA, AAPL, MSTR, PLTR, SpaceX)..."
          className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted/70 focus:border-accent focus:ring-1 focus:ring-accent"
        />
        {results.length > 0 && query.trim().length > 0 && (
          <ul className="elevated absolute z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-border-subtle bg-surface shadow-xl">
            {results.map((a) => (
              <li key={a.mint}>
                <button
                  type="button"
                  onClick={() => addAsset(a.underlyingSymbol, a.name)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs transition-colors hover:bg-surface-hover cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CompanyLogo symbol={a.underlyingSymbol} size={22} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{a.underlyingSymbol}</span>
                        <span className="font-mono text-[10px] text-muted">
                          {a.mint.slice(0, 4)}...{a.mint.slice(-4)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted">{a.name}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-strong shrink-0 ml-2">
                    + Add
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Assets List */}
      {assets.length > 0 && (
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{assets.length} selected equities</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={equalizeWeights}
                className="font-medium text-accent hover:underline"
              >
                Equalize weights
              </button>
              {remaining !== 0 && (
                <button
                  type="button"
                  onClick={distributeRemaining}
                  className="font-medium text-accent hover:underline"
                >
                  Distribute remaining ({remaining > 0 ? `+${remaining}%` : `${remaining}%`})
                </button>
              )}
            </div>
          </div>

          <ul className="space-y-2">
            {assets.map((a, i) => (
              <li
                key={a.symbol}
                className="flex items-center gap-3 rounded-xl border border-border-subtle/80 bg-background/60 px-3.5 py-2.5"
              >
                <CompanyLogo symbol={a.symbol} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono font-bold text-sm text-foreground">{a.symbol}</span>
                    {ASSET_METADATA[a.symbol]?.mint && (
                      <span className="font-mono text-[10px] text-muted hidden sm:inline">
                        {ASSET_METADATA[a.symbol].mint!.slice(0, 4)}...{ASSET_METADATA[a.symbol].mint!.slice(-4)}
                      </span>
                    )}
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: chartColor(i) }}
                    />
                  </div>
                  <p className="truncate text-xs text-muted">
                    {ASSET_METADATA[a.symbol]?.sector ? `${ASSET_METADATA[a.symbol].sector} • ` : ""}{a.name}
                  </p>
                </div>

                {/* Weight slider & input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={a.weight}
                  onChange={(e) => updateWeight(a.symbol, Number(e.target.value) || 0)}
                  className="hidden sm:block w-24 accent-accent cursor-pointer"
                />

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={a.weight}
                    onChange={(e) => updateWeight(a.symbol, Number(e.target.value) || 0)}
                    className="w-14 rounded-lg border border-border-subtle bg-surface px-2 py-1 text-right font-mono text-sm font-bold outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                  <span className="font-mono text-xs text-muted">%</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeAsset(a.symbol)}
                  className="rounded-lg p-1 text-muted transition-colors hover:bg-negative-soft hover:text-negative"
                  aria-label={`Remove ${a.symbol}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Allocation Progress Bar */}
      <div className="mt-5 border-t border-border-subtle pt-3.5">
        <div className="h-2 w-full overflow-hidden rounded-md bg-background">
          <div
            className={`h-full rounded-md transition-all duration-300 ${
              isValid ? "bg-positive" : total > 100 ? "bg-negative" : "bg-accent"
            }`}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">Total Allocation Target: 100%</span>
          <span
            className={`font-mono font-bold ${
              isValid
                ? "text-positive"
                : total > 100
                ? "text-negative"
                : "text-foreground"
            }`}
          >
            {total}% {isValid ? "✓ Balanced" : total > 100 ? `(${total - 100}% over)` : `(${remaining}% needed)`}
          </span>
        </div>
      </div>
    </div>
  );
}


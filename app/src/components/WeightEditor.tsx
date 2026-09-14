"use client";

import { useMemo, useState } from "react";
import { chartColor } from "@/lib/chart-colors";
import { CompanyLogo } from "@/components/TickerChip";
import { searchXStocks, getPopularXStocks, findXStock } from "@/lib/xstocks/registry";
import { blockInvalidNumberKeys, blurOnWheel } from "@/lib/number-input";

export type DraftAsset = { symbol: string; name: string; weight: number };

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none">
      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GripIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 16" fill="currentColor">
      <circle cx="2.5" cy="2.5" r="1.25" />
      <circle cx="7.5" cy="2.5" r="1.25" />
      <circle cx="2.5" cy="8" r="1.25" />
      <circle cx="7.5" cy="8" r="1.25" />
      <circle cx="2.5" cy="13.5" r="1.25" />
      <circle cx="7.5" cy="13.5" r="1.25" />
    </svg>
  );
}

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  function reorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = [...assets];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
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
          <p className="text-sm font-medium text-muted">Or start with a curated template:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_STARTERS.map((qs) => (
              <button
                key={qs.label}
                type="button"
                onClick={() => onChange(qs.assets)}
                className="rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:border-accent hover:text-accent active:scale-95"
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
          className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-base outline-none transition-all placeholder:text-muted/70"
        />
        {results.length > 0 && query.trim().length > 0 && (
          <ul className="elevated absolute z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-border-subtle bg-surface shadow-xl">
            {results.map((a) => (
              <li key={a.mint}>
                <button
                  type="button"
                  onClick={() => addAsset(a.underlyingSymbol, a.name)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CompanyLogo symbol={a.underlyingSymbol} size={26} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{a.underlyingSymbol}</span>
                        <span className="font-mono text-xs text-muted">
                          {a.mint.slice(0, 4)}...{a.mint.slice(-4)}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted">{a.name}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong shrink-0 ml-2">
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
          <div className="flex items-center justify-between text-sm text-muted">
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
                draggable
                onDragStart={() => setDraggedIndex(i)}
                onDragEnter={() => setDragOverIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex !== null) reorder(draggedIndex, i);
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`flex items-center gap-3 rounded-xl border bg-background/60 px-3.5 py-2.5 transition-colors ${
                  draggedIndex === i
                    ? "opacity-40 border-border-subtle/80"
                    : dragOverIndex === i && draggedIndex !== null
                    ? "border-accent"
                    : "border-border-subtle/80"
                }`}
              >
                <span className="shrink-0 cursor-grab text-muted/60 hover:text-muted active:cursor-grabbing" aria-label="Drag to reorder">
                  <GripIcon className="h-4 w-2.5" />
                </span>
                <CompanyLogo symbol={a.symbol} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono font-bold text-base text-foreground">{a.symbol}</span>
                    {findXStock(a.symbol)?.mint && (
                      <span className="font-mono text-xs text-muted hidden sm:inline">
                        {findXStock(a.symbol)!.mint.slice(0, 4)}...{findXStock(a.symbol)!.mint.slice(-4)}
                      </span>
                    )}
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: chartColor(i) }}
                    />
                  </div>
                  <p className="truncate text-sm text-muted">{a.name}</p>
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
                    onKeyDown={blockInvalidNumberKeys}
                    onWheel={blurOnWheel}
                    className="w-16 rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-right font-mono text-base font-bold outline-none"
                  />
                  <span className="font-mono text-sm text-muted">%</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeAsset(a.symbol)}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-negative-soft hover:text-negative"
                  aria-label={`Remove ${a.symbol}`}
                >
                  <XIcon className="h-2.5 w-2.5" />
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

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted">Target allocation: 100%</span>
          <span
            className={`inline-flex items-center gap-1 font-mono font-semibold ${
              isValid ? "text-positive" : total > 100 ? "text-negative" : "text-foreground"
            }`}
          >
            {isValid && <CheckIcon className="h-2.5 w-2.5" />}
            {total}% {isValid ? "balanced" : total > 100 ? `(${total - 100}% over)` : `(${remaining}% needed)`}
          </span>
        </div>
      </div>
    </div>
  );
}


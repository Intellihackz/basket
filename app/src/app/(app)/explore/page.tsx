"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { PublicIndex } from "@/lib/db/index-stats";
import { POPULAR_TICKERS } from "@/lib/xstocks/registry";
import IndexCard from "@/components/IndexCard";
import { CompanyLogo } from "@/components/TickerChip";
import { getCachedIndexes, isIndexesCacheStale, setIndexesCache } from "@/lib/indexes-cache";

const SORTS = [
  { id: "Trending", label: "Trending" },
  { id: "Top Performers", label: "Top Return" },
  { id: "Most Held", label: "Most Popular" },
  { id: "New", label: "Newest" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

function sortFor(sortId: SortId) {
  switch (sortId) {
    case "Trending":
    case "Top Performers":
      return (a: PublicIndex, b: PublicIndex) =>
        (b.returnSincePublishPct ?? -Infinity) - (a.returnSincePublishPct ?? -Infinity);
    case "New":
      return (a: PublicIndex, b: PublicIndex) => b.createdAt.localeCompare(a.createdAt);
    case "Most Held":
      return (a: PublicIndex, b: PublicIndex) => b.holders - a.holders;
  }
}

const TICKER_SYMBOLS = POPULAR_TICKERS.slice(0, 9);

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none">
      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 6" fill="none">
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export default function ExplorePage() {
  const [indexes, setIndexes] = useState<PublicIndex[]>(() => getCachedIndexes() ?? []);
  const [loading, setLoading] = useState(() => getCachedIndexes() === null);
  const [tickerPrices, setTickerPrices] = useState<Record<string, number>>({});

  const [sortId, setSortId] = useState<SortId>("Trending");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetFilterOpen, setAssetFilterOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A fresh cache is shown immediately with no refetch; a stale (or missing) one still
    // refetches, but only the missing case shows a loading state — a stale-but-present
    // cache updates quietly in place once the response lands.
    if (isIndexesCacheStale()) {
      fetch("/api/indexes")
        .then((res) => res.json())
        .then((data) => {
          const list: PublicIndex[] = data.indexes ?? [];
          setIndexes(list);
          setIndexesCache(list);
        })
        .finally(() => setLoading(false));
    }

    fetch(`/api/prices?symbols=${TICKER_SYMBOLS.join(",")}`)
      .then((res) => res.json())
      .then((data) => setTickerPrices(data.prices ?? {}));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAssetFilterOpen(false);
      }
    }
    if (assetFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [assetFilterOpen]);

  const basketStocks = useMemo(() => {
    const stockMap: Record<string, { count: number; name: string }> = {};
    indexes.forEach((idx) => {
      idx.assets.forEach((a) => {
        if (!stockMap[a.symbol]) {
          stockMap[a.symbol] = { count: 0, name: a.symbol };
        }
        stockMap[a.symbol].count += 1;
      });
    });

    return Object.entries(stockMap)
      .map(([symbol, data]) => ({ symbol, name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count || a.symbol.localeCompare(b.symbol));
  }, [indexes]);

  const filteredStocks = useMemo(() => {
    if (!stockSearch.trim()) return basketStocks;
    const q = stockSearch.toLowerCase();
    return basketStocks.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [basketStocks, stockSearch]);

  function toggleAsset(symbol: string) {
    setSelectedAssets((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  }

  const filtered = useMemo(() => {
    return indexes
      .filter((i) => {
        if (selectedAssets.length > 0) {
          const hasSelected = i.assets.some((a) => selectedAssets.includes(a.symbol));
          if (!hasSelected) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesName = i.name.toLowerCase().includes(q);
        const matchesDesc = i.description.toLowerCase().includes(q);
        const matchesCreator = i.creatorUsername.toLowerCase().includes(q);
        const matchesTicker = i.assets.some((a) => a.symbol.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesCreator || matchesTicker;
      })
      .sort(sortFor(sortId));
  }, [indexes, selectedAssets, searchQuery, sortId]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Live equities strip */}
      <div className="mb-10 flex animate-fade-up items-center gap-5 border-b border-border-subtle pb-4">
        <div className="flex shrink-0 items-center gap-2 border-r border-border-subtle pr-4">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted">
            Solana equities
          </span>
        </div>
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
          <div className="flex w-max animate-marquee items-center gap-6">
            {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((symbol, i) => (
              <div key={`${symbol}-${i}`} className="flex items-center gap-2 text-xs font-mono">
                <CompanyLogo symbol={symbol} size={15} />
                <span className="font-semibold text-foreground">{symbol}</span>
                <span className="text-muted">
                  {tickerPrices[symbol] !== undefined ? `$${tickerPrices[symbol].toFixed(2)}` : "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editorial header */}
      <div className="max-w-2xl animate-fade-up" style={{ animationDelay: "150ms" }}>
        <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-foreground">
          Discover baskets.
          <br />
          Invest in any of them.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          A community-curated marketplace for stock baskets built from tokenized equities on
          Solana.
        </p>
      </div>

      {/* All Baskets */}
      <div id="baskets" className="mt-12 scroll-mt-24 animate-fade-up" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">Baskets</h2>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Create a basket
          </Link>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search baskets, tickers, or creators..."
              className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2 pl-9 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
            />
            <svg
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="m17.5 17.5-3.6-3.6m1.1-4.4a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted hover:text-foreground"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setAssetFilterOpen(!assetFilterOpen)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  selectedAssets.length > 0
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-border-subtle bg-surface text-foreground hover:border-foreground/20"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-current shrink-0">
                  <path
                    d="M2 3.5H14M4 8H12M6.5 12.5H9.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
                <span>
                  {selectedAssets.length === 0
                    ? "Filter by stocks"
                    : `${selectedAssets.length} stock${selectedAssets.length > 1 ? "s" : ""}`}
                </span>
                <ChevronDownIcon className="h-2.5 w-2.5 opacity-60" />
              </button>

              {assetFilterOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-border-subtle bg-surface p-3.5 shadow-lg z-50">
                  <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
                    <span className="text-xs font-semibold text-foreground">Filter by constituent stocks</span>
                    {selectedAssets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedAssets([])}
                        className="text-[11px] font-medium text-accent hover:underline cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      placeholder="Search stocks (e.g. NVDA, AAPL)..."
                      className="w-full rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div className="mt-2 max-h-56 overflow-y-auto space-y-0.5 pr-1">
                    {filteredStocks.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted">No matching stocks</p>
                    ) : (
                      filteredStocks.map((stock) => {
                        const isChecked = selectedAssets.includes(stock.symbol);
                        return (
                          <label
                            key={stock.symbol}
                            className={`flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-accent-soft text-accent-strong font-medium"
                                : "hover:bg-surface-hover text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleAsset(stock.symbol)}
                                className="h-4 w-4 rounded accent-accent cursor-pointer"
                              />
                              <CompanyLogo symbol={stock.symbol} size={18} />
                              <span className="font-mono font-semibold text-foreground">{stock.symbol}</span>
                            </div>
                            <span className="font-mono text-[11px] text-muted shrink-0">
                              {stock.count} {stock.count === 1 ? "basket" : "baskets"}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5">
                    <span className="text-[11px] text-muted font-mono">{selectedAssets.length} selected</span>
                    <button
                      type="button"
                      onClick={() => setAssetFilterOpen(false)}
                      className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground hover:bg-accent-strong cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <select
                value={sortId}
                onChange={(e) => setSortId(e.target.value as SortId)}
                className="appearance-none rounded-xl border border-border-subtle bg-surface px-3.5 py-2 pr-7 text-xs font-medium text-foreground outline-none transition-colors hover:border-foreground/20 focus:border-accent cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sort: {s.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted" />
            </div>

            {(selectedAssets.length > 0 || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAssets([]);
                  setSearchQuery("");
                }}
                className="rounded-xl border border-border-subtle px-2.5 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {selectedAssets.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted font-medium">Baskets holding:</span>
            {selectedAssets.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => toggleAsset(symbol)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong hover:bg-accent hover:text-accent-foreground transition-colors group cursor-pointer"
              >
                <CompanyLogo symbol={symbol} size={14} />
                <span>{symbol}</span>
                <XIcon className="h-2.5 w-2.5" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedAssets([])}
              className="text-xs text-muted hover:text-foreground underline decoration-border-subtle font-medium ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-border-subtle p-12 text-center">
            <p className="text-sm text-muted">Loading baskets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle p-12 text-center">
            <p className="font-display text-lg text-foreground">
              {indexes.length === 0 ? "No baskets published yet" : "No baskets found"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {indexes.length === 0
                ? "Be the first to publish a basket."
                : selectedAssets.length > 0
                ? `No baskets contain ${selectedAssets.join(", ")}${
                    searchQuery ? ` matching "${searchQuery}"` : ""
                  }.`
                : `No baskets matched "${searchQuery}".`}
            </p>
            <Link
              href="/create"
              className="mt-4 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-strong cursor-pointer"
            >
              {indexes.length === 0 ? "Create a basket" : "Clear all filters"}
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((index) => (
              <IndexCard key={index.id} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

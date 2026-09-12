"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { PublicIndex } from "@/lib/db/index-stats";
import { POPULAR_TICKERS, XSTOCKS } from "@/lib/xstocks/registry";
import IndexCard from "@/components/IndexCard";
import { CompanyLogo } from "@/components/TickerChip";

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

export default function ExplorePage() {
  const [indexes, setIndexes] = useState<PublicIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickerPrices, setTickerPrices] = useState<Record<string, number>>({});

  const [sortId, setSortId] = useState<SortId>("Trending");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetFilterOpen, setAssetFilterOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/indexes")
      .then((res) => res.json())
      .then((data) => setIndexes(data.indexes ?? []))
      .finally(() => setLoading(false));

    fetch(`/api/prices?symbols=${TICKER_SYMBOLS.join(",")}`)
      .then((res) => res.json())
      .then((data) => setTickerPrices(data.prices ?? {}));
  }, []);

  // Close asset filter dropdown on click outside
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

  // Aggregate all unique stocks present in baskets with count
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Live Tokenized Equities Ticker Ribbon */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border-subtle bg-surface/80 py-2.5 backdrop-blur-sm shadow-xs">
        <div className="flex items-center gap-5 overflow-x-auto px-4 scrollbar-none">
          <div className="flex shrink-0 items-center gap-2 border-r border-border-subtle/80 pr-4">
            <span className="h-2 w-2 rounded-full bg-positive animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
              Solana Equities
            </span>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            {TICKER_SYMBOLS.map((symbol) => (
              <div key={symbol} className="flex items-center gap-2 text-xs font-mono">
                <CompanyLogo symbol={symbol} size={16} />
                <span className="font-bold text-foreground">{symbol}</span>
                <span className="text-muted font-medium">
                  {tickerPrices[symbol] !== undefined ? `$${tickerPrices[symbol].toFixed(2)}` : "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editorial Hero Banner */}
      <div className="elevated relative overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-accent-strong via-[#8e4909] to-[#6d3403] px-7 py-10 sm:px-12 sm:py-14 text-accent-foreground shadow-lg">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fde68a] animate-pulse" />
            <span>{XSTOCKS.length} TOKENIZED EQUITIES ON SOLANA</span>
          </div>

          <h1 className="font-display mt-4 text-4xl leading-[1.08] sm:text-5xl font-bold tracking-tight text-accent-foreground">
            Discover baskets.
            <br />
            Invest in any of them.
          </h1>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-accent-foreground/80 font-normal">
            A community-curated marketplace for stock baskets built from tokenized equities on
            Solana. Browse what others have published and invest in the whole basket with one
            transaction.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-surface px-6 py-2.5 text-sm font-semibold text-accent-strong shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
            >
              Create a basket
              <span aria-hidden>→</span>
            </Link>
            <a
              href="#baskets"
              className="inline-flex items-center rounded-xl border border-accent-foreground/30 px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-white/10"
            >
              See all baskets
            </a>
          </div>
        </div>

        {/* Hero Artwork */}
        <div className="pointer-events-none absolute right-4 bottom-0 hidden h-full w-[420px] items-center justify-center lg:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero.gif" alt="Stocklana thematic index basket" className="w-full max-w-[380px] drop-shadow-xl" />
        </div>
      </div>

      {/* Baskets & Indexes Section */}
      <div id="baskets" className="mt-10 scroll-mt-24">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            All Baskets
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Discover baskets built by the community and invest in the ones you believe in.
        </p>

        {/* Compact Baskets Toolbar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-4">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search baskets, tickers, or creators..."
              className="elevated w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2 pl-9 text-xs outline-none transition-all placeholder:text-muted/70 focus:border-accent focus:ring-1 focus:ring-accent"
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
                className="absolute right-2.5 top-2 text-xs text-muted hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setAssetFilterOpen(!assetFilterOpen)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
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
                    ? "Filter by Stocks"
                    : `${selectedAssets.length} stock${selectedAssets.length > 1 ? "s" : ""}`}
                </span>
                <span className="text-[10px] opacity-70">▼</span>
              </button>

              {assetFilterOpen && (
                <div className="elevated absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-border-subtle bg-surface p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle/80">
                    <span className="text-xs font-bold text-foreground">
                      Filter by Constituent Stocks
                    </span>
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
                              <div className="min-w-0">
                                <span className="font-mono font-bold text-foreground">
                                  {stock.symbol}
                                </span>
                              </div>
                            </div>

                            <span className="font-mono text-[11px] text-muted shrink-0">
                              {stock.count} {stock.count === 1 ? "basket" : "baskets"}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border-subtle/80 pt-2.5">
                    <span className="text-[11px] text-muted font-mono">
                      {selectedAssets.length} selected
                    </span>
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
                className="appearance-none rounded-xl border border-border-subtle bg-surface px-3.5 py-2 pr-7 text-xs font-medium text-foreground outline-none transition-all hover:border-foreground/20 focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer shadow-2xs"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sort: {s.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 1L5 5L9 1" />
              </svg>
            </div>

            {(selectedAssets.length > 0 || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAssets([]);
                  setSearchQuery("");
                }}
                className="rounded-xl border border-border-subtle bg-surface-hover px-2.5 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Reset all filters"
              >
                Reset
              </button>
            )}

            <span className="font-mono text-xs text-muted pl-1">
              {filtered.length} {filtered.length === 1 ? "basket" : "baskets"}
            </span>
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong hover:bg-accent hover:text-accent-foreground transition-all group cursor-pointer shadow-2xs"
              >
                <CompanyLogo symbol={symbol} size={14} />
                <span>{symbol}</span>
                <span className="text-[10px] text-accent-strong group-hover:text-accent-foreground">
                  ✕
                </span>
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
          <div className="elevated mt-8 flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface p-12 text-center">
            <p className="text-sm text-muted">Loading the registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="elevated mt-8 flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface p-12 text-center">
            <p className="font-display text-lg font-semibold text-foreground">
              {indexes.length === 0 ? "No baskets published yet" : "No baskets found"}
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted">
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
            {filtered.map((index, i) => (
              <div
                key={index.id}
                className={i === 0 && selectedAssets.length === 0 && !searchQuery ? "sm:col-span-2 lg:col-span-2" : ""}
              >
                <IndexCard
                  index={index}
                  featured={i === 0 && selectedAssets.length === 0 && !searchQuery}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

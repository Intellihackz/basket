"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { indexes, formatUsd, MARKET_TICKER_ITEMS, ASSET_METADATA } from "@/lib/mock-data";
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
      return (a: (typeof indexes)[number], b: (typeof indexes)[number]) => b.return30d - a.return30d;
    case "New":
      return (a: (typeof indexes)[number], b: (typeof indexes)[number]) =>
        b.createdAt.localeCompare(a.createdAt);
    case "Top Performers":
      return (a: (typeof indexes)[number], b: (typeof indexes)[number]) =>
        b.returnInception - a.returnInception;
    case "Most Held":
      return (a: (typeof indexes)[number], b: (typeof indexes)[number]) => b.holders - a.holders;
  }
}

export default function ExplorePage() {
  const [sortId, setSortId] = useState<SortId>("Trending");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetFilterOpen, setAssetFilterOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

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
          stockMap[a.symbol] = {
            count: 0,
            name: ASSET_METADATA[a.symbol]?.name || a.name || a.symbol,
          };
        }
        stockMap[a.symbol].count += 1;
      });
    });

    return Object.entries(stockMap)
      .map(([symbol, data]) => ({
        symbol,
        name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count || a.symbol.localeCompare(b.symbol));
  }, []);

  const filteredStocks = useMemo(() => {
    if (!stockSearch.trim()) return basketStocks;
    const q = stockSearch.toLowerCase();
    return basketStocks.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [basketStocks, stockSearch]);

  const totalValue = useMemo(() => indexes.reduce((sum, i) => sum + i.totalValueUsd, 0), []);
  const totalHolders = useMemo(() => indexes.reduce((sum, i) => sum + i.holders, 0), []);
  const topPerformer = useMemo(
    () => [...indexes].sort((a, b) => b.returnInception - a.returnInception)[0],
    []
  );

  function toggleAsset(symbol: string) {
    setSelectedAssets((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  }

  const filtered = useMemo(() => {
    return indexes
      .filter((i) => {
        // Asset filter: basket must contain AT LEAST ONE selected stock
        if (selectedAssets.length > 0) {
          const hasSelected = i.assets.some((a) => selectedAssets.includes(a.symbol));
          if (!hasSelected) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesName = i.name.toLowerCase().includes(q);
        const matchesDesc = i.description.toLowerCase().includes(q);
        const matchesCreator = i.creatorUsername.toLowerCase().includes(q);
        const matchesTicker = i.assets.some(
          (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
        );
        return matchesName || matchesDesc || matchesCreator || matchesTicker;
      })
      .sort(sortFor(sortId));
  }, [selectedAssets, searchQuery, sortId]);

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
            {MARKET_TICKER_ITEMS.map((item) => (
              <div key={item.symbol} className="flex items-center gap-2 text-xs font-mono">
                <CompanyLogo symbol={item.symbol} size={16} />
                <span className="font-bold text-foreground">{item.symbol}</span>
                <span className="text-muted font-medium">${item.price.toFixed(2)}</span>
                <span
                  className={`text-[11px] font-semibold tabular-nums ${
                    item.change >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editorial Hero Banner */}
      <div className="elevated relative overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-accent-strong via-[#8e4909] to-[#6d3403] px-7 py-10 sm:px-12 sm:py-14 text-accent-foreground shadow-lg">
        {/* Subtle decorative dot pattern */}
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
            <span>798 TOKENIZED EQUITIES ON SOLANA</span>
          </div>

          <h1 className="font-display mt-4 text-4xl leading-[1.08] sm:text-5xl font-bold tracking-tight text-accent-foreground">
            Your thesis.
            <br />
            Your index.
          </h1>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-accent-foreground/80 font-normal">
            Build custom baskets of tokenized equities. Discover indexes built by other investors and invest in an entire market thesis in a single transaction.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-surface px-6 py-2.5 text-sm font-semibold text-accent-strong shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
            >
              Create an index
              <span aria-hidden>→</span>
            </Link>
            <a
              href="#baskets"
              className="inline-flex items-center rounded-xl border border-accent-foreground/30 px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-white/10"
            >
              Browse indexes
            </a>
          </div>
        </div>

        {/* Hero Artwork */}
        <div className="pointer-events-none absolute right-4 bottom-0 hidden h-full w-[420px] items-center justify-center lg:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero.gif" alt="Stocklana thematic index basket" className="w-full max-w-[380px] drop-shadow-xl" />
        </div>
      </div>

      {/* Editorial Platform Stats Strip */}
      <div className="elevated mt-6 grid grid-cols-2 gap-4 divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface p-4 sm:grid-cols-4 sm:divide-x sm:divide-y-0 sm:p-5">
        <div className="px-2 py-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Allocated</p>
          <p className="font-display mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {formatUsd(totalValue)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">across tokenized stocks</p>
        </div>

        <div className="px-2 py-1 sm:pl-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Active Holders</p>
          <p className="font-display mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {totalHolders.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">wallet investors</p>
        </div>

        <div className="px-2 py-1 sm:pl-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Tokenized Equities</p>
          <p className="font-display mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            798
          </p>
          <p className="mt-0.5 text-[11px] text-muted">live on Solana mainnet</p>
        </div>

        <div className="px-2 py-1 sm:pl-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Top Inception Gain</p>
          <p className="font-display mt-1 text-2xl font-bold tabular-nums text-positive sm:text-3xl">
            +{topPerformer.returnInception.toFixed(1)}%
          </p>
          <p className="mt-0.5 text-[11px] text-muted">by @{topPerformer.creatorUsername}</p>
        </div>
      </div>

      {/* Baskets & Indexes Section */}
      <div id="baskets" className="mt-10 scroll-mt-24">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Baskets & Indexes
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Discover and back thematic equity baskets from onchain curators.
        </p>

        {/* Compact Baskets Toolbar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search baskets, tickers, or curators..."
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

          {/* Controls: Asset Filter Popover + Sort Selector + Count */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Assets (Checkbox Dropdown) */}
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

              {/* Asset Dropdown Popover */}
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

                  {/* Stock search input */}
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      placeholder="Search stocks (e.g. NVDA, AAPL)..."
                      className="w-full rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-xs outline-none focus:border-accent"
                    />
                  </div>

                  {/* Stock checkboxes list */}
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
                                <span className="ml-1.5 text-[11px] text-muted truncate">
                                  {stock.name}
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

                  {/* Popover Footer */}
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

            {/* Sort Dropdown */}
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

            {/* Reset Filters button if any filter applied */}
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

            {/* Result count */}
            <span className="font-mono text-xs text-muted pl-1">
              {filtered.length} {filtered.length === 1 ? "basket" : "baskets"}
            </span>
          </div>
        </div>

        {/* Active Selected Asset Chips Bar */}
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

        {/* Indexes Grid */}
        {filtered.length === 0 ? (
          <div className="elevated mt-8 flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface p-12 text-center">
            <p className="font-display text-lg font-semibold text-foreground">No baskets found</p>
            <p className="mt-1 max-w-sm text-xs text-muted">
              {selectedAssets.length > 0
                ? `No baskets contain ${selectedAssets.join(", ")}${
                    searchQuery ? ` matching "${searchQuery}"` : ""
                  }.`
                : `No baskets matched "${searchQuery}".`}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAssets([]);
              }}
              className="mt-4 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-strong cursor-pointer"
            >
              Clear all filters
            </button>
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


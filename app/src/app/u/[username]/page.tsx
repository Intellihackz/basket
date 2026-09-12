"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  profiles,
  getIndexesByCreator,
  indexes,
  formatUsd,
  formatUsdFull,
  formatPercent,
  defaultHoldings,
  ASSET_METADATA,
} from "@/lib/mock-data";
import Avatar from "@/components/Avatar";
import AllocationBar from "@/components/AllocationBar";
import IndexCard from "@/components/IndexCard";
import { CompanyLogo } from "@/components/TickerChip";
import { useMockSession } from "@/lib/mock-session";
import { AVATAR_STYLES, indexForUsername } from "@/lib/avatar-styles";

export default function ProfilePage() {
  const { username: routeUsername } = useParams<{ username: string }>();
  const session = useMockSession();
  const isOwnProfile = session.signedIn && session.username === routeUsername;

  const [activeTab, setActiveTab] = useState<"portfolio" | "indexes">("portfolio");
  const [copied, setCopied] = useState(false);

  const seedProfile = profiles[routeUsername];
  if (!seedProfile && !isOwnProfile) notFound();

  const bio = seedProfile?.bio ?? "Curating thematic tokenized stock baskets on Solana.";
  const walletLinked = isOwnProfile ? session.walletLinked : (seedProfile?.walletLinked ?? false);
  const walletShort = isOwnProfile ? session.walletShort : seedProfile?.walletShort;
  const avatarIndex = session.avatarIndex ?? indexForUsername(routeUsername);

  const created = getIndexesByCreator(routeUsername);
  const totalHolders = created.reduce((sum, i) => sum + i.holders, 0);
  const totalVolume = created.reduce((sum, i) => sum + i.totalValueUsd, 0);
  const best = [...created].sort((a, b) => b.returnInception - a.returnInception)[0];

  const positions = defaultHoldings
    .map((h) => {
      const idx = indexes.find((i) => i.id === h.indexId);
      return idx ? { ...h, index: idx } : null;
    })
    .filter(Boolean) as (typeof defaultHoldings[0] & { index: typeof indexes[0] })[];

  const totalPortfolioValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalInvested = positions.reduce((sum, p) => sum + p.invested, 0);
  const netPnL = totalPortfolioValue - totalInvested;
  const totalReturn = totalInvested > 0 ? (netPnL / totalInvested) * 100 : 0;

  // Aggregate look-through stock exposure across all held positions
  const stockExposureMap: Record<string, { symbol: string; name: string; usdValue: number }> = {};
  positions.forEach((p) => {
    p.index.assets.forEach((asset) => {
      const assetUsd = p.currentValue * (asset.weightBps / 10000);
      if (!stockExposureMap[asset.symbol]) {
        stockExposureMap[asset.symbol] = {
          symbol: asset.symbol,
          name: asset.name,
          usdValue: 0,
        };
      }
      stockExposureMap[asset.symbol].usdValue += assetUsd;
    });
  });

  const underlyingStocks = Object.values(stockExposureMap).sort(
    (a, b) => b.usdValue - a.usdValue
  );

  function copyWallet() {
    if (!walletShort) return;
    navigator.clipboard?.writeText(walletShort);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back to Explore */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
      >
        <span aria-hidden>←</span> Explore Baskets
      </Link>

      {/* Curator Profile Header Card */}
      <div className="elevated mt-4 rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar Column */}
          <div className="flex shrink-0 flex-col items-center text-center sm:items-start sm:text-left sm:w-52">
            <div className="relative">
              <Avatar
                username={routeUsername}
                size={84}
                styleIndex={isOwnProfile ? avatarIndex : null}
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md border-2 border-surface bg-accent text-[10px] text-accent-foreground">
                ★
              </span>
            </div>

            {/* Avatar Selector (for logged-in user) */}
            {isOwnProfile && (
              <div className="mt-3.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1.5">
                  Choose Ticker Style:
                </p>
                <div className="flex gap-1.5">
                  {AVATAR_STYLES.map((style, i) => (
                    <button
                      key={style.src}
                      onClick={() => session.setAvatar(i)}
                      aria-label={`Use ${style.ticker} avatar`}
                      className={`rounded-xl p-0.5 transition-all duration-150 active:scale-90 cursor-pointer ${
                        avatarIndex === i
                          ? "ring-2 ring-accent"
                          : "ring-1 border-border-subtle hover:ring-foreground/30"
                      }`}
                      title={style.ticker}
                    >
                      <Avatar username={routeUsername} size={24} styleIndex={i} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bio & Curator Metrics */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    @{routeUsername}
                  </h1>
                  <span className="rounded-md bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-strong">
                    Curator
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted max-w-xl">{bio}</p>
              </div>

              {isOwnProfile && (
                <button
                  onClick={session.signOut}
                  className="rounded-xl border border-border-subtle px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-negative hover:text-negative cursor-pointer"
                >
                  Sign out
                </button>
              )}
            </div>

            {/* Platform Credibility Stats */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-y border-border-subtle/80 py-4">
              <div>
                <p className="font-display text-xl font-bold tabular-nums text-foreground">
                  {created.length}
                </p>
                <p className="text-xs text-muted">curated indexes</p>
              </div>

              <div>
                <p className="font-display text-xl font-bold tabular-nums text-foreground">
                  {totalHolders.toLocaleString()}
                </p>
                <p className="text-xs text-muted">total holders</p>
              </div>

              <div>
                <p className="font-display text-xl font-bold tabular-nums text-foreground">
                  {formatUsd(totalVolume)}
                </p>
                <p className="text-xs text-muted">managed volume</p>
              </div>

              {best && (
                <div>
                  <p className="font-display text-xl font-bold tabular-nums text-positive">
                    {formatPercent(best.returnInception)}
                  </p>
                  <p className="text-xs text-muted">best ({best.name})</p>
                </div>
              )}
            </div>

            {/* Wallet Status Strip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle/60 bg-background/50 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    walletLinked ? "bg-positive animate-pulse" : "bg-muted/50"
                  }`}
                />
                <span className="text-muted">Solana Wallet:</span>
                <span className="font-mono font-medium text-foreground">
                  {walletLinked ? walletShort : "Not linked"}
                </span>
                {walletLinked && (
                  <button
                    onClick={copyWallet}
                    className="ml-1 text-[11px] text-accent hover:underline font-medium"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>

              {isOwnProfile && !walletLinked && (
                <button
                  onClick={session.linkWallet}
                  className="rounded-xl bg-accent px-3.5 py-1 text-xs font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent-strong active:scale-95 cursor-pointer"
                >
                  Connect Solana Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Portfolio Holdings vs Curated Indexes */}
      <div className="mt-10">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                activeTab === "portfolio"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              Portfolio Holdings
            </button>
          )}

          <button
            onClick={() => setActiveTab("indexes")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              activeTab === "indexes" || !isOwnProfile
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Curated Indexes ({created.length})
          </button>
        </div>

        {/* Portfolio View */}
        {isOwnProfile && activeTab === "portfolio" && (
          <div className="mt-6">
            {!walletLinked ? (
              <div className="elevated flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-7">
                <h3 className="font-display text-lg font-bold text-foreground">
                  Link your Solana wallet
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-muted">
                  Connect a Solana wallet to monitor your tokenized stock holdings, track live
                  profits, and rebalance your baskets.
                </p>
                <button
                  onClick={session.linkWallet}
                  className="mt-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-150 hover:bg-accent-strong active:scale-95 cursor-pointer"
                >
                  Connect Solana Wallet
                </button>
              </div>
            ) : (
              <div>
                {/* Portfolio Summary Card */}
                <div className="elevated rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Total Portfolio Balance
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-4">
                    <span className="font-display text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
                      {formatUsdFull(totalPortfolioValue)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                        totalReturn >= 0
                          ? "bg-positive-soft text-positive border border-positive/20"
                          : "bg-negative-soft text-negative border border-negative/20"
                      }`}
                    >
                      {totalReturn >= 0 ? "↗ +" : "↘ "}
                      {formatUsdFull(netPnL)} ({totalReturn.toFixed(1)}%)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Invested capital: <strong className="text-foreground">{formatUsdFull(totalInvested)}</strong>
                  </p>
                </div>

                {/* Look-Through Stock Exposure Card */}
                {underlyingStocks.length > 0 && (
                  <div className="elevated mt-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-display text-base font-bold text-foreground">
                          Look-Through Underlying Exposure
                        </h4>
                        <p className="text-xs text-muted">
                          Net aggregated equity exposure across all {positions.length} active baskets
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-muted bg-background px-2.5 py-1 rounded-md border border-border-subtle/60 self-start sm:self-auto">
                        {underlyingStocks.length} underlying companies
                      </span>
                    </div>

                    {/* Stacked visual distribution bar */}
                    <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-md bg-border-subtle/50">
                      {underlyingStocks.map((stock, i) => {
                        const pct = totalPortfolioValue > 0 ? (stock.usdValue / totalPortfolioValue) * 100 : 0;
                        const palette = [
                          "bg-amber-600",
                          "bg-orange-500",
                          "bg-amber-500",
                          "bg-emerald-600",
                          "bg-teal-600",
                          "bg-sky-600",
                          "bg-indigo-500",
                          "bg-rose-500",
                          "bg-stone-400",
                        ];
                        const barColor = palette[i % palette.length];
                        return (
                          <div
                            key={stock.symbol}
                            style={{ width: `${pct}%` }}
                            className={`${barColor} transition-all duration-300 hover:opacity-80`}
                            title={`${stock.symbol}: ${pct.toFixed(1)}% (${formatUsdFull(stock.usdValue)})`}
                          />
                        );
                      })}
                    </div>

                    {/* Constituent Cards Grid */}
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {underlyingStocks.slice(0, 8).map((stock) => {
                        const pct = totalPortfolioValue > 0 ? (stock.usdValue / totalPortfolioValue) * 100 : 0;
                        const meta = ASSET_METADATA[stock.symbol];
                        return (
                          <div
                            key={stock.symbol}
                            className="flex items-center justify-between gap-2.5 rounded-xl border border-border-subtle/70 bg-background/50 p-2.5 transition-colors hover:border-border-subtle hover:bg-background"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CompanyLogo symbol={stock.symbol} size={22} />
                              <div className="min-w-0">
                                <p className="font-mono text-xs font-bold text-foreground truncate">
                                  {stock.symbol}
                                </p>
                                <p className="text-[10px] text-muted truncate">
                                  {meta?.sector || stock.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono text-xs font-semibold text-foreground tabular-nums">
                                {pct.toFixed(1)}%
                              </p>
                              <p className="text-[10px] text-muted tabular-nums">
                                {formatUsd(stock.usdValue)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Individual Positions */}
                <h3 className="font-display mt-8 text-lg font-bold text-foreground">
                  Active Basket Positions
                </h3>

                <div className="mt-4 space-y-3">
                  {positions.map((p) => {
                    const returnPct = ((p.currentValue - p.invested) / p.invested) * 100;
                    const posGain = p.currentValue - p.invested;
                    return (
                      <div
                        key={p.indexId}
                        className="elevated elevated-hover rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/index/${p.indexId}`}
                                className="font-display text-lg font-bold text-foreground hover:text-accent transition-colors"
                              >
                                {p.index.name}
                              </Link>
                              <span className="rounded-full bg-background border border-border-subtle px-2 py-0.5 font-mono text-[10px] font-medium text-muted">
                                {p.index.assets.length} stocks
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              Cost basis: {formatUsdFull(p.invested)} • Acquired {p.purchasedAt}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-display text-xl font-bold tabular-nums text-foreground">
                                {formatUsdFull(p.currentValue)}
                              </p>
                              <p
                                className={`text-xs font-semibold tabular-nums ${
                                  returnPct >= 0 ? "text-positive" : "text-negative"
                                }`}
                              >
                                {returnPct >= 0 ? "+" : ""}
                                {formatUsdFull(posGain)} ({returnPct.toFixed(1)}%)
                              </p>
                            </div>

                            <Link
                              href={`/index/${p.indexId}`}
                              className="rounded-xl bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent-strong hover:bg-accent hover:text-accent-foreground transition-all"
                            >
                              Invest More
                            </Link>
                          </div>
                        </div>

                        {/* Composition mini bar */}
                        <div className="mt-4 border-t border-border-subtle/80 pt-3">
                          <AllocationBar assets={p.index.assets} showLegend={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Curated Indexes View */}
        {(activeTab === "indexes" || !isOwnProfile) && (
          <div className="mt-6">
            {created.length === 0 ? (
              <div className="elevated flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-7">
                <p className="text-sm text-muted">
                  {isOwnProfile
                    ? "You haven't published an index yet."
                    : `@${routeUsername} hasn't published an index yet.`}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/create"
                    className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent-strong active:scale-95"
                  >
                    Create Your First Index
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {created.map((index) => (
                  <IndexCard key={index.id} index={index} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


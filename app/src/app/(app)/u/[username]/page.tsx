"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { formatUsd, formatUsdFull, formatPercent } from "@/lib/mock-data";
import type { PublicIndex } from "@/lib/db/index-stats";
import type { PublicPosition } from "@/app/api/purchases/me/route";
import { findXStock } from "@/lib/xstocks/registry";
import { chartColor } from "@/lib/chart-colors";
import Avatar from "@/components/Avatar";
import AllocationBar from "@/components/AllocationBar";
import IndexCard from "@/components/IndexCard";
import { CompanyLogo } from "@/components/TickerChip";
import { useSession } from "@/lib/session";
import { AVATAR_STYLES } from "@/lib/avatar-styles";

type PublicProfile = {
  username: string;
  avatarIndex: number | null;
  walletLinked: boolean;
  walletShort: string | null;
};

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none">
      <path
        d="M9.5 1.5L12.5 4.5L4.5 12.5H1.5V9.5L9.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function TrendGlyph({ positive }: { positive: boolean }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="shrink-0">
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

export default function ProfilePage() {
  const { username: routeUsername } = useParams<{ username: string }>();
  const router = useRouter();
  const session = useSession();
  const isOwnProfile = session.signedIn && session.username === routeUsername;

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(routeUsername);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [created, setCreated] = useState<PublicIndex[]>([]);
  const [positions, setPositions] = useState<PublicPosition[]>([]);
  const [activeTab, setActiveTab] = useState<"portfolio" | "baskets">("portfolio");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOwnProfile) return; // own profile reads live session state instead
    fetch(`/api/users/${routeUsername}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setProfile(data.user))
      .catch(() => setNotFoundState(true));
  }, [routeUsername, isOwnProfile]);

  useEffect(() => {
    fetch(`/api/indexes/by-creator/${routeUsername}`)
      .then((res) => res.json())
      .then((data) => setCreated(data.indexes ?? []));
  }, [routeUsername]);

  useEffect(() => {
    if (!isOwnProfile || !session.userId) return;
    fetch(`/api/purchases/me?userId=${session.userId}`)
      .then((res) => res.json())
      .then((data) => setPositions(data.positions ?? []));
  }, [isOwnProfile, session.userId]);

  if (notFoundState && !isOwnProfile) notFound();

  const walletLinked = isOwnProfile ? session.walletLinked : (profile?.walletLinked ?? false);
  const walletShort = isOwnProfile ? session.walletShort : profile?.walletShort;
  const avatarIndex = isOwnProfile ? session.avatarIndex : profile?.avatarIndex ?? null;

  const totalHolders = created.reduce((sum, i) => sum + i.holders, 0);
  const totalVolume = created.reduce((sum, i) => sum + i.totalInvestedUsd, 0);
  const best = [...created]
    .filter((i) => i.returnSincePublishPct !== null)
    .sort((a, b) => (b.returnSincePublishPct ?? 0) - (a.returnSincePublishPct ?? 0))[0];

  const totalPortfolioValue = positions.reduce((sum, p) => sum + p.currentValueUsd, 0);
  const totalInvested = positions.reduce((sum, p) => sum + p.investedUsd, 0);
  const netPnL = totalPortfolioValue - totalInvested;
  const totalReturn = totalInvested > 0 ? (netPnL / totalInvested) * 100 : 0;

  // Aggregate look-through stock exposure across all held positions
  const stockExposureMap: Record<string, { symbol: string; usdValue: number }> = {};
  positions.forEach((p) => {
    p.assets.forEach((asset) => {
      const assetUsd = p.currentValueUsd * (asset.weightBps / 10000);
      if (!stockExposureMap[asset.symbol]) {
        stockExposureMap[asset.symbol] = { symbol: asset.symbol, usdValue: 0 };
      }
      stockExposureMap[asset.symbol].usdValue += assetUsd;
    });
  });

  const underlyingStocks = Object.values(stockExposureMap).sort((a, b) => b.usdValue - a.usdValue);

  function copyWallet() {
    if (!walletShort) return;
    navigator.clipboard?.writeText(walletShort);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function startEditingUsername() {
    setUsernameDraft(routeUsername);
    setUsernameError(null);
    setEditingUsername(true);
  }

  function cancelEditingUsername() {
    setEditingUsername(false);
    setUsernameError(null);
  }

  async function saveUsername() {
    const next = usernameDraft.trim().toLowerCase();
    if (next === routeUsername) {
      setEditingUsername(false);
      return;
    }
    if (!/^[a-z0-9]{3,20}$/.test(next)) {
      setUsernameError("3-20 characters, lowercase letters and numbers only");
      return;
    }
    setSavingUsername(true);
    setUsernameError(null);
    const result = await session.setUsername(next);
    setSavingUsername(false);
    if (!result.ok) {
      setUsernameError(result.error ?? "Failed to update username");
      return;
    }
    setEditingUsername(false);
    router.replace(`/u/${next}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Profile header */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-8 sm:p-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center text-center sm:items-start sm:text-left">
            <Avatar username={routeUsername} size={132} styleIndex={avatarIndex} />

            {isOwnProfile && (
              <div className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-3">
                {AVATAR_STYLES.map((style, i) => (
                  <button
                    key={style.src}
                    onClick={() => session.setAvatar(i)}
                    aria-label={`Use ${style.ticker} avatar`}
                    className={`rounded-xl p-1 transition-all duration-150 active:scale-95 cursor-pointer ${
                      avatarIndex === i ? "ring-2 ring-accent" : "hover:bg-surface-hover"
                    }`}
                    title={style.ticker}
                  >
                    <Avatar username={routeUsername} size={30} styleIndex={i} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {editingUsername ? (
                  <div className="flex items-center gap-2">
                    <span className="font-display text-3xl font-medium text-muted sm:text-4xl">@</span>
                    <input
                      autoFocus
                      value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveUsername();
                        if (e.key === "Escape") cancelEditingUsername();
                      }}
                      className="w-40 rounded-xl border border-border-subtle bg-background px-3 py-1.5 font-display text-2xl font-medium tracking-tight text-foreground outline-none focus:border-accent sm:text-3xl"
                    />
                    <button
                      onClick={saveUsername}
                      disabled={savingUsername}
                      aria-label="Save username"
                      className="rounded-lg p-1.5 text-positive transition-colors hover:bg-positive-soft disabled:opacity-40 cursor-pointer"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={cancelEditingUsername}
                      aria-label="Cancel"
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover cursor-pointer"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                      @{routeUsername}
                    </h1>
                    {isOwnProfile && (
                      <button
                        onClick={startEditingUsername}
                        aria-label="Edit username"
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="rounded-lg bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-strong">
                      Curator
                    </span>
                  </>
                )}
              </div>

              {isOwnProfile && (
                <button
                  onClick={session.signOut}
                  className="rounded-xl border border-border-subtle px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:border-negative hover:text-negative cursor-pointer"
                >
                  Sign out
                </button>
              )}
            </div>

            {usernameError && <p className="mt-1.5 text-xs text-negative">{usernameError}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className={`h-1.5 w-1.5 rounded-full ${walletLinked ? "bg-positive" : "bg-muted/50"}`} />
              <span className="text-muted">
                {walletLinked ? (
                  <>
                    Solana wallet <span className="font-mono font-medium text-foreground">{walletShort}</span>
                  </>
                ) : (
                  "No Solana wallet linked"
                )}
              </span>
              {walletLinked && (
                <button onClick={copyWallet} className="font-medium text-accent hover:underline cursor-pointer">
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
              {isOwnProfile && !walletLinked && (
                <button
                  onClick={session.linkWallet}
                  className="rounded-xl bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer"
                >
                  Connect wallet
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="font-display text-3xl font-medium tabular-nums text-foreground">{created.length}</p>
                <p className="text-sm text-muted">baskets created</p>
              </div>
              <div>
                <p className="font-display text-3xl font-medium tabular-nums text-foreground">
                  {totalHolders.toLocaleString()}
                </p>
                <p className="text-sm text-muted">total investors</p>
              </div>
              <div>
                <p className="font-display text-3xl font-medium tabular-nums text-foreground">
                  {formatUsd(totalVolume)}
                </p>
                <p className="text-sm text-muted">total invested</p>
              </div>
              {best && (
                <div>
                  <p className="font-display text-3xl font-medium tabular-nums text-positive">
                    {formatPercent(best.returnSincePublishPct!)}
                  </p>
                  <p className="text-sm text-muted">best ({best.name})</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <div className="flex items-center gap-2 border-b border-border-subtle">
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                activeTab === "portfolio" ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              Portfolio
            </button>
          )}

          <button
            onClick={() => setActiveTab("baskets")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              activeTab === "baskets" || !isOwnProfile
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Baskets ({created.length})
          </button>
        </div>

        {isOwnProfile && activeTab === "portfolio" && (
          <div className="mt-6">
            {!walletLinked ? (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-7">
                <h3 className="font-display text-lg font-medium text-foreground">Link your Solana wallet</h3>
                <p className="max-w-md text-sm leading-relaxed text-muted">
                  Connect a Solana wallet to buy into baskets and track your real holdings.
                </p>
                <button
                  onClick={session.linkWallet}
                  className="mt-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer"
                >
                  Connect Solana wallet
                </button>
              </div>
            ) : positions.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-7">
                <p className="text-sm text-muted">You haven&apos;t bought into a basket yet.</p>
                <Link
                  href="/explore"
                  className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95"
                >
                  Explore baskets
                </Link>
              </div>
            ) : (
              <div>
                <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Total portfolio value</p>
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-4">
                    <span className="font-display text-3xl font-medium tabular-nums text-foreground sm:text-4xl">
                      {formatUsdFull(totalPortfolioValue)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                        totalReturn >= 0 ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"
                      }`}
                    >
                      <TrendGlyph positive={totalReturn >= 0} />
                      {formatUsdFull(netPnL)} ({totalReturn.toFixed(2)}%)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Invested capital: <strong className="text-foreground">{formatUsdFull(totalInvested)}</strong>
                  </p>
                </div>

                {underlyingStocks.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-display text-base font-medium text-foreground">
                          Underlying exposure
                        </h4>
                        <p className="text-xs text-muted">
                          Net aggregated equity exposure across all {positions.length} active baskets
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-muted bg-surface-hover px-2.5 py-1 rounded-lg self-start sm:self-auto">
                        {underlyingStocks.length} companies
                      </span>
                    </div>

                    <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                      {underlyingStocks.map((stock, i) => {
                        const pct = totalPortfolioValue > 0 ? (stock.usdValue / totalPortfolioValue) * 100 : 0;
                        return (
                          <div
                            key={stock.symbol}
                            style={{ width: `${pct}%`, backgroundColor: chartColor(i) }}
                            className="transition-opacity duration-150 hover:opacity-80"
                            title={`${stock.symbol}: ${pct.toFixed(1)}% (${formatUsdFull(stock.usdValue)})`}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {underlyingStocks.slice(0, 8).map((stock) => {
                        const pct = totalPortfolioValue > 0 ? (stock.usdValue / totalPortfolioValue) * 100 : 0;
                        return (
                          <div
                            key={stock.symbol}
                            className="flex items-center justify-between gap-2.5 rounded-xl border border-border-subtle p-2.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CompanyLogo symbol={stock.symbol} size={22} />
                              <p className="font-mono text-xs font-bold text-foreground truncate">{stock.symbol}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono text-xs font-semibold text-foreground tabular-nums">
                                {pct.toFixed(1)}%
                              </p>
                              <p className="text-[10px] text-muted tabular-nums">{formatUsd(stock.usdValue)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <h3 className="font-display mt-8 text-lg font-medium text-foreground">Active positions</h3>

                <div className="mt-4 space-y-3">
                  {positions.map((p) => {
                    const returnPct = p.investedUsd > 0 ? ((p.currentValueUsd - p.investedUsd) / p.investedUsd) * 100 : 0;
                    const posGain = p.currentValueUsd - p.investedUsd;
                    const displayAssets = p.assets.map((a) => ({ ...a, name: findXStock(a.symbol)?.name ?? a.symbol }));
                    return (
                      <div key={p.indexId} className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/index/${p.indexId}`}
                                className="font-display text-lg font-medium text-foreground hover:text-accent transition-colors"
                              >
                                {p.indexName}
                              </Link>
                              <span className="rounded-lg bg-surface-hover px-2 py-0.5 font-mono text-[10px] font-medium text-muted">
                                {p.assets.length} stocks
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              Cost basis: {formatUsdFull(p.investedUsd)} • Acquired {new Date(p.purchasedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-display text-xl font-medium tabular-nums text-foreground">
                                {formatUsdFull(p.currentValueUsd)}
                              </p>
                              <p className={`text-xs font-semibold tabular-nums ${returnPct >= 0 ? "text-positive" : "text-negative"}`}>
                                {returnPct >= 0 ? "+" : ""}
                                {formatUsdFull(posGain)} ({returnPct.toFixed(2)}%)
                              </p>
                            </div>

                            <Link
                              href={`/index/${p.indexId}`}
                              className="rounded-xl bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent-strong hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              Invest more
                            </Link>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-border-subtle pt-3">
                          <AllocationBar assets={displayAssets} showLegend={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {(activeTab === "baskets" || !isOwnProfile) && (
          <div className="mt-6">
            {created.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-7">
                <p className="text-sm text-muted">
                  {isOwnProfile ? "You haven't published a basket yet." : `@${routeUsername} hasn't published a basket yet.`}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/create"
                    className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95"
                  >
                    Create a basket
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

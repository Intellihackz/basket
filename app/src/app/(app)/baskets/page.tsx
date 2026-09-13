"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicIndex } from "@/lib/db/index-stats";
import { formatUsd, formatUsdFull, formatPercent } from "@/lib/mock-data";
import type { WalletHoldingWithValue } from "@/app/api/wallet/holdings/route";
import IndexCard from "@/components/IndexCard";
import { CompanyLogo } from "@/components/TickerChip";
import { useSession } from "@/lib/session";

function ExternalLinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none">
      <path d="M3 1.5H8.5V7M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 7.5C3 6.12 4.12 5 5.5 5H17C18.1 5 19 5.9 19 7V8H16.5C14.84 8 13.5 9.34 13.5 11V13C13.5 14.66 14.84 16 16.5 16H19V17C19 18.1 18.1 19 17 19H5.5C4.12 19 3 17.88 3 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M19 8H21C21.55 8 22 8.45 22 9V15C22 15.55 21.55 16 21 16H19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="16.75" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export default function BasketsPage() {
  const session = useSession();

  const [created, setCreated] = useState<PublicIndex[]>([]);
  const [createdLoaded, setCreatedLoaded] = useState(false);
  const [holdings, setHoldings] = useState<WalletHoldingWithValue[]>([]);
  const [holdingsLoaded, setHoldingsLoaded] = useState(false);

  useEffect(() => {
    if (!session.username) return;
    fetch(`/api/indexes/by-creator/${session.username}`)
      .then((res) => res.json())
      .then((data) => setCreated(data.indexes ?? []))
      .finally(() => setCreatedLoaded(true));
  }, [session.username]);

  useEffect(() => {
    if (!session.walletAddress) return;
    fetch(`/api/wallet/holdings?address=${session.walletAddress}`)
      .then((res) => res.json())
      .then((data) => setHoldings(data.holdings ?? []))
      .finally(() => setHoldingsLoaded(true));
  }, [session.walletAddress]);

  const totalHolders = created.reduce((sum, i) => sum + i.holders, 0);
  const totalVolume = created.reduce((sum, i) => sum + i.totalInvestedUsd, 0);
  const best = [...created]
    .filter((i) => i.returnSincePublishPct !== null)
    .sort((a, b) => (b.returnSincePublishPct ?? 0) - (a.returnSincePublishPct ?? 0))[0];

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + (h.valueUsd ?? 0), 0);

  if (!session.signedIn || !session.username) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="animate-fade-up flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-8">
          <h1 className="font-display text-2xl font-medium text-foreground">Sign in to view your baskets</h1>
          <p className="text-sm leading-relaxed text-muted">
            Track what you&apos;ve bought into and what you&apos;ve published.
          </p>
          <button
            onClick={() => session.signIn()}
            className="mt-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Portfolio */}
      <div className="max-w-2xl animate-fade-up">
        <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-foreground">
          Your baskets.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          Stocks & Baskets you&apos;ve bought into and their live performance.
        </p>
      </div>

      <div className="animate-fade-up mt-6" style={{ animationDelay: "150ms" }}>
        {/* Wallet */}
        <div className="flex items-center justify-between gap-6 rounded-2xl border border-border-subtle bg-surface p-7">
          <div>
            <h3 className="font-display text-xl font-medium text-foreground">Your wallet</h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">
              {session.walletLinked ? (
                <>
                  Connected · <span className="font-mono text-foreground">{session.walletShort}</span>. Reads real
                  xStock balances directly from this wallet on Solana.
                </>
              ) : (
                "Connect a Solana wallet to buy into baskets and see what you actually hold."
              )}
            </p>
            {!session.walletLinked && (
              <button
                onClick={session.linkWallet}
                className="mt-4 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer"
              >
                Connect Solana wallet
              </button>
            )}
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-soft">
            <WalletIcon className="h-7 w-7 text-accent-strong" />
          </div>
        </div>

        {session.walletLinked && holdingsLoaded && holdings.length === 0 && (
          <p className="mt-6 text-sm text-muted">
            No xStock holdings found in this wallet.{" "}
            <Link href="/explore" className="font-medium text-accent hover:underline">
              Explore baskets
            </Link>
          </p>
        )}

        {session.walletLinked && holdings.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Portfolio value</p>
            <p className="mt-1.5 font-display text-3xl font-medium tabular-nums text-foreground sm:text-4xl">
              {formatUsdFull(totalPortfolioValue)}
            </p>

            <div className="mt-8 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-medium text-foreground">Your stocks</h3>
              <span className="text-xs text-muted">{holdings.length}</span>
            </div>

            <div className="mt-3 divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
              {holdings.map((h) => (
                <a
                  key={h.mint}
                  href={`https://jup.ag/tokens/${h.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CompanyLogo symbol={h.symbol} size={36} />
                    <div className="min-w-0">
                      <p className="font-display text-base font-medium text-foreground">{h.symbol}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{h.name}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="font-display text-base font-medium tabular-nums text-foreground">
                        {h.valueUsd !== null ? formatUsdFull(h.valueUsd) : "—"}
                      </p>
                      <p className="text-xs text-muted">
                        {h.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} shares
                        {h.priceUsd !== null && ` · $${h.priceUsd.toFixed(2)}`}
                      </p>
                    </div>
                    <ExternalLinkIcon className="h-2.5 w-2.5 text-muted" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Baskets you've created */}
      <div className="animate-fade-up mt-14 border-t border-border-subtle pt-10" style={{ animationDelay: "300ms" }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Your baskets
            </h2>
            <p className="mt-2 text-sm text-muted">Baskets you&apos;ve published and their live performance.</p>
          </div>
          <Link
            href="/create"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95"
          >
            Create a basket
          </Link>
        </div>

        {created.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7">
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
        )}

        <div className="mt-8">
          {!createdLoaded ? null : created.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-7">
              <p className="text-sm text-muted">You haven&apos;t published a basket yet.</p>
              <Link
                href="/create"
                className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95"
              >
                Create a basket
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {created.map((index) => (
                <IndexCard key={index.id} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

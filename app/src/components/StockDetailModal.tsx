"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CompanyLogo } from "@/components/TickerChip";

export type StockDetailAsset = {
  symbol: string;
  name: string;
  weightBps: number;
  mint?: string;
  isTradingHalted?: boolean;
};

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none">
      <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none">
      <path d="M3 1.5H8.5V7M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatReturn(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export default function StockDetailModal({
  asset,
  livePrice,
  returnSincePublishPct,
  onClose,
}: {
  asset: StockDetailAsset;
  livePrice?: number;
  returnSincePublishPct?: number | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function copyMint() {
    if (!asset.mint) return;
    navigator.clipboard?.writeText(asset.mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CompanyLogo symbol={asset.symbol} size={48} />
            <div>
              <p className="font-mono text-lg font-bold text-foreground">{asset.symbol}</p>
              <p className="text-base text-muted">{asset.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>

        {asset.isTradingHalted && (
          <span className="mt-4 inline-block rounded-lg bg-negative-soft px-2.5 py-1 text-sm font-semibold text-negative">
            Trading halted
          </span>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border-subtle pt-4">
          <div>
            <p className="text-sm text-muted">Live price</p>
            <p className="font-display text-3xl font-medium tabular-nums text-foreground">
              {livePrice !== undefined ? `$${livePrice.toFixed(2)}` : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Weight in this basket</p>
            <p className="font-display text-3xl font-medium tabular-nums text-foreground">
              {(asset.weightBps / 100).toFixed(0)}%
            </p>
          </div>
          {returnSincePublishPct !== undefined && (
            <div>
              <p className="text-sm text-muted">Since basket publish</p>
              <p
                className={`font-display text-3xl font-medium tabular-nums ${
                  returnSincePublishPct === null
                    ? "text-base text-muted"
                    : returnSincePublishPct >= 0
                    ? "text-positive"
                    : "text-negative"
                }`}
              >
                {returnSincePublishPct === null ? "N/A" : formatReturn(returnSincePublishPct)}
              </p>
            </div>
          )}
        </div>

        {asset.mint && (
          <a
            href={`https://jup.ag/tokens/${asset.mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border-subtle py-2.5 text-base font-medium text-foreground transition-colors hover:border-foreground/20 hover:bg-surface-hover"
          >
            View chart on Jupiter
            <ExternalLinkIcon className="h-2.5 w-2.5" />
          </a>
        )}

        {asset.mint && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border-subtle p-3">
            <div className="min-w-0">
              <p className="text-sm text-muted">Solana Token-2022 mint</p>
              <p className="font-mono text-sm font-medium text-foreground truncate">{asset.mint}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3 pl-3">
              <button onClick={copyMint} className="text-sm font-medium text-accent hover:underline cursor-pointer">
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={`https://solscan.io/token/${asset.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                Solscan
                <ExternalLinkIcon className="h-2 w-2" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

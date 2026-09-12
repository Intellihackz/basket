"use client";

import { useState } from "react";
import type { Asset } from "@/lib/mock-data";
import { formatUsdFull } from "@/lib/mock-data";
import { useMockSession } from "@/lib/mock-session";
import SignInModal from "@/components/SignInModal";
import { chartColor } from "@/lib/chart-colors";
import { CompanyLogo } from "@/components/TickerChip";

const PRESETS_USDC = [50, 100, 250, 500, 1000];
const PRESETS_SOL = [0.5, 1, 2, 5, 10];

type TxStep = "idle" | "routing" | "swapping" | "minting" | "confirmed";

export default function BuyPanel({ assets }: { assets: Asset[] }) {
  const { signedIn, walletLinked, linkWallet } = useMockSession();
  const [amount, setAmount] = useState("250");
  const [currency, setCurrency] = useState<"USDC" | "SOL">("USDC");
  const [signInOpen, setSignInOpen] = useState(false);
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const amountNum = Number(amount) || 0;
  const solEquivalent = (amountNum / 154.2).toFixed(3);

  function handleBuyClick() {
    if (!signedIn) {
      setSignInOpen(true);
      return;
    }
    if (!walletLinked) {
      return;
    }

    // Realistic Solana Execution sequence
    setTxStep("routing");
    setTimeout(() => {
      setTxStep("swapping");
      setTimeout(() => {
        setTxStep("minting");
        setTimeout(() => {
          setTxStep("confirmed");
          setTxHash(`5Kx...${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
          setTimeout(() => {
            setTxStep("idle");
            setTxHash(null);
          }, 6000);
        }, 900);
      }, 900);
    }, 800);
  }

  const isExecuting = txStep !== "idle" && txStep !== "confirmed";

  return (
    <div className="elevated rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
          Invest in Basket
        </h3>
        <div className="inline-flex rounded-lg border border-border-subtle bg-background p-0.5 text-[11px] font-medium">
          <button
            onClick={() => {
              setCurrency("USDC");
              if (currency === "SOL") setAmount("250");
            }}
            className={`rounded-md px-2.5 py-0.5 transition-colors cursor-pointer ${
              currency === "USDC" ? "bg-accent text-accent-foreground font-semibold" : "text-muted"
            }`}
          >
            USDC
          </button>
          <button
            onClick={() => {
              setCurrency("SOL");
              if (currency === "USDC") setAmount("1.5");
            }}
            className={`rounded-md px-2.5 py-0.5 transition-colors cursor-pointer ${
              currency === "SOL" ? "bg-accent text-accent-foreground font-semibold" : "text-muted"
            }`}
          >
            SOL
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-muted">
        Proportionally routes tokenized stock purchases in a single Solana transaction.
      </p>

      {/* Amount Input */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted">
          <span>Amount ({currency})</span>
          {currency === "SOL" ? (
            <span className="font-mono text-foreground font-normal">≈ {formatUsdFull(amountNum * 154.2)}</span>
          ) : (
            <span className="font-mono text-foreground font-normal">≈ {solEquivalent} SOL</span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border-subtle bg-background px-4 py-3 transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
          <span className="text-xl font-semibold text-foreground/60">
            {currency === "USDC" ? "$" : "◎"}
          </span>
          <input
            type="number"
            min="0.01"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-xl font-bold tracking-tight outline-none font-mono"
            placeholder="0"
          />
          <span className="font-mono text-xs font-semibold text-foreground">{currency}</span>
        </div>

        {/* Quick Amount Presets */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(currency === "USDC" ? PRESETS_USDC : PRESETS_SOL).map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className={`flex-1 rounded-lg border py-1 text-xs font-semibold transition-colors cursor-pointer ${
                amountNum === preset
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border-subtle bg-surface text-muted hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              {currency === "USDC" ? `$${preset}` : `${preset}◎`}
            </button>
          ))}
        </div>
      </div>

      {/* Investment Shared Across Stocks */}
      <div className="mt-4 rounded-xl border border-border-subtle/80 bg-background/50 p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <span>Shared Across Stocks</span>
          <span className="font-mono text-foreground">
            {amountNum > 0
              ? currency === "USDC"
                ? `$${amountNum.toFixed(2)}`
                : `${amountNum} SOL`
              : "—"}
          </span>
        </div>

        {/* Proportional micro-bar */}
        <div className="mt-2.5 flex h-1.5 w-full gap-[2px] overflow-hidden rounded-md bg-surface">
          {assets.map((a, i) => (
            <div
              key={a.symbol}
              className="h-full"
              style={{ width: `${a.weightBps / 100}%`, backgroundColor: chartColor(i) }}
              title={`${a.symbol}: ${(a.weightBps / 100).toFixed(0)}%`}
            />
          ))}
        </div>

        {/* Per-stock shared amount breakdown list */}
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-0.5">
          {assets.map((asset) => {
            const weightPct = asset.weightBps / 100;
            const shareValue = (amountNum * weightPct) / 100;
            return (
              <li key={asset.symbol} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CompanyLogo symbol={asset.symbol} size={18} />
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="font-mono font-bold text-foreground">{asset.symbol}</span>
                    <span className="font-mono text-[10px] text-muted">({weightPct.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="text-right font-mono font-semibold tabular-nums text-foreground">
                  {currency === "USDC" ? (
                    <span>${shareValue.toFixed(2)}</span>
                  ) : (
                    <span>{shareValue.toFixed(3)} SOL</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Order Execution Details */}
      <div className="mt-3.5 space-y-1.5 rounded-xl border border-border-subtle/80 bg-background/40 p-3 text-xs">
        <div className="flex items-center justify-between text-muted">
          <span>Protocol Fee</span>
          <span className="font-semibold text-positive">0% ($0.00)</span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Routing & Gas</span>
          <span className="font-mono text-foreground">Jupiter DEX • &lt;$0.01</span>
        </div>
      </div>

      {/* Execution Stepper Banner */}
      {isExecuting && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft p-3.5 text-xs text-accent-strong space-y-2">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
              {txStep === "routing" && "1/3 Simulating optimal route..."}
              {txStep === "swapping" && "2/3 Swapping on Jupiter DEX..."}
              {txStep === "minting" && "3/3 Minting tokenized basket LP..."}
            </span>
            <span className="font-mono text-[10px]">Processing</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-surface">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{
                width: txStep === "routing" ? "33%" : txStep === "swapping" ? "66%" : "95%",
              }}
            />
          </div>
        </div>
      )}

      {/* Confirmed Receipt */}
      {txStep === "confirmed" && txHash && (
        <div className="mt-4 rounded-xl border border-positive/30 bg-positive-soft p-3.5 text-xs text-positive space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <span>✓</span>
            <span>Transaction confirmed on Solana!</span>
          </div>
          <p className="text-[11px] text-positive/90">
            Minted proportional basket tokens into your linked wallet.
          </p>
          <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-positive/80 border-t border-positive/20 pt-1.5">
            <span>Tx: {txHash}</span>
            <span className="underline cursor-pointer">View on Solscan ↗</span>
          </div>
        </div>
      )}

      {/* Action CTA */}
      <div className="mt-5">
        {signedIn && !walletLinked ? (
          <div className="rounded-xl border border-accent/20 bg-accent-soft p-4">
            <p className="text-xs leading-relaxed text-accent-strong">
              Connect your Solana wallet to execute onchain orders with real tokens.
            </p>
            <button
              onClick={linkWallet}
              className="mt-3 w-full rounded-xl bg-accent py-2.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all duration-150 hover:bg-accent-strong active:scale-[0.98]"
            >
              Connect Solana Wallet
            </button>
          </div>
        ) : (
          <button
            onClick={handleBuyClick}
            disabled={amountNum <= 0 || isExecuting}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-150 hover:bg-accent-strong hover:shadow active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            {isExecuting
              ? "Executing on Solana..."
              : signedIn
              ? `Buy Basket for ${currency === "USDC" ? `$${amountNum}` : `${amountNum} SOL`}`
              : "Sign in to invest"}
          </button>
        )}
      </div>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}



"use client";

import { useMemo, useState } from "react";
import { useWallets, useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import bs58 from "bs58";
import type { Asset } from "@/lib/mock-data";
import { formatUsdFull } from "@/lib/mock-data";
import { findXStock } from "@/lib/xstocks/registry";
import { useSession } from "@/lib/session";
import { chartColor } from "@/lib/chart-colors";
import { CompanyLogo } from "@/components/TickerChip";
import { planBasketBuy } from "@/lib/jupiter/build-basket-tx";
import { USDC_MINT, WSOL_MINT } from "@/lib/jupiter/client";
import { blockInvalidNumberKeys, blurOnWheel } from "@/lib/number-input";
import { getConnection, confirmSignature } from "@/lib/solana/connection";

const PRESETS_USDC = [50, 100, 250, 500, 1000];
const PRESETS_SOL = [0.5, 1, 2, 5, 10];

type TxStatus =
  | { step: "idle" }
  | { step: "quoting" }
  | { step: "signing"; batch: number; total: number }
  | { step: "confirming"; batch: number; total: number }
  | { step: "confirmed"; signatures: string[] }
  | { step: "error"; message: string };

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

export default function BuyPanel({ indexId, assets }: { indexId: string; assets: Asset[] }) {
  const { signedIn, userId, walletLinked, walletAddress, linkWallet, signIn } = useSession();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [amount, setAmount] = useState("250");
  const [currency, setCurrency] = useState<"USDC" | "SOL">("USDC");
  const [status, setStatus] = useState<TxStatus>({ step: "idle" });

  const connection = useMemo(() => getConnection(), []);

  const amountNum = Number(amount) || 0;
  const solEquivalent = (amountNum / 154.2).toFixed(3);

  async function handleBuyClick() {
    if (!signedIn) {
      signIn();
      return;
    }
    if (!walletLinked || !walletAddress) return;

    const wallet = wallets.find((w) => w.address === walletAddress);
    if (!wallet) {
      setStatus({ step: "error", message: "Linked wallet not found. Try reconnecting it." });
      return;
    }

    const resolvedAssets = assets
      .map((a) => ({
        symbol: a.symbol,
        mint: a.mint || findXStock(a.symbol)?.mint,
        weightBps: a.weightBps,
      }))
      .filter((a): a is { symbol: string; mint: string; weightBps: number } => Boolean(a.mint));

    if (resolvedAssets.length === 0) {
      setStatus({ step: "error", message: "None of this basket's assets could be resolved to a mint." });
      return;
    }

    const inputMint = currency === "USDC" ? USDC_MINT : WSOL_MINT;
    const decimals = currency === "USDC" ? 1_000_000 : 1_000_000_000;

    try {
      setStatus({ step: "quoting" });
      const plan = await planBasketBuy({
        connection,
        userPublicKey: walletAddress,
        inputMint,
        totalAmountBaseUnits: Math.floor(amountNum * decimals),
        assets: resolvedAssets,
      });

      const signatures: string[] = [];
      for (let i = 0; i < plan.transactions.length; i++) {
        setStatus({ step: "signing", batch: i + 1, total: plan.transactions.length });
        const { signature } = await signAndSendTransaction({
          transaction: plan.transactions[i],
          wallet,
        });
        const encoded = bs58.encode(signature);

        // A signature back from the wallet is not proof the transaction went through —
        // it's produced at sign time, before broadcast. Only the network confirming it
        // (with no onchain error) means it actually happened.
        setStatus({ step: "confirming", batch: i + 1, total: plan.transactions.length });
        await confirmSignature(connection, encoded);
        signatures.push(encoded);
      }

      setStatus({ step: "confirmed", signatures });

      if (userId) {
        fetch("/api/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            indexId,
            buyerUserId: userId,
            walletAddress,
            currency,
            amountBaseUnits: Math.floor(amountNum * decimals),
            signatures,
          }),
        }).catch((err) => console.error("Failed to record purchase:", err));
      }
    } catch (err) {
      setStatus({
        step: "error",
        message: err instanceof Error ? err.message : "The swap didn't go through.",
      });
    }
  }

  const isExecuting = status.step === "quoting" || status.step === "signing" || status.step === "confirming";

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-medium tracking-tight text-foreground">Buy this basket</h3>
        <div className="inline-flex rounded-lg border border-border-subtle p-0.5 text-sm font-medium">
          <button
            onClick={() => {
              setCurrency("USDC");
              if (currency === "SOL") setAmount("250");
            }}
            className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
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
            className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
              currency === "SOL" ? "bg-accent text-accent-foreground font-semibold" : "text-muted"
            }`}
          >
            SOL
          </button>
        </div>
      </div>

      <p className="mt-1 text-base text-muted">
        Routes proportional tokenized stock purchases in a single Solana transaction.
      </p>

      {/* Amount input */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-sm font-medium uppercase tracking-wider text-muted">
          <span>Amount ({currency})</span>
          {currency === "SOL" ? (
            <span className="font-mono text-foreground font-normal">≈ {formatUsdFull(amountNum * 154.2)}</span>
          ) : (
            <span className="font-mono text-foreground font-normal">≈ {solEquivalent} SOL</span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border-subtle bg-background px-4 py-3 transition-colors">
          <span className="text-2xl font-semibold text-foreground/60">{currency === "USDC" ? "$" : "◎"}</span>
          <input
            type="number"
            min="0.01"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={blockInvalidNumberKeys}
            onWheel={blurOnWheel}
            className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none font-mono"
            placeholder="0"
          />
          <span className="font-mono text-sm font-semibold text-foreground">{currency}</span>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(currency === "USDC" ? PRESETS_USDC : PRESETS_SOL).map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className={`flex-1 rounded-lg border py-1 text-sm font-semibold transition-colors cursor-pointer ${
                amountNum === preset
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border-subtle text-muted hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              {currency === "USDC" ? `$${preset}` : `${preset}◎`}
            </button>
          ))}
        </div>
      </div>

      {/* Shared across stocks */}
      <div className="mt-5 border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted">
          <span>Shared across stocks</span>
          <span className="font-mono text-foreground">
            {amountNum > 0 ? (currency === "USDC" ? `$${amountNum.toFixed(2)}` : `${amountNum} SOL`) : "$0.00"}
          </span>
        </div>

        <div className="mt-2.5 flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full bg-surface-hover">
          {assets.map((a, i) => (
            <div
              key={a.symbol}
              className="h-full"
              style={{ width: `${a.weightBps / 100}%`, backgroundColor: chartColor(i) }}
              title={`${a.symbol}: ${(a.weightBps / 100).toFixed(0)}%`}
            />
          ))}
        </div>

        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-0.5">
          {assets.map((asset) => {
            const weightPct = asset.weightBps / 100;
            const shareValue = (amountNum * weightPct) / 100;
            return (
              <li key={asset.symbol} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <CompanyLogo symbol={asset.symbol} size={18} />
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="font-mono font-bold text-foreground">{asset.symbol}</span>
                    <span className="font-mono text-xs text-muted">({weightPct.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="text-right font-mono font-semibold tabular-nums text-foreground">
                  {currency === "USDC" ? <span>${shareValue.toFixed(2)}</span> : <span>{shareValue.toFixed(3)} SOL</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Execution details */}
      <div className="mt-4 space-y-1.5 border-t border-border-subtle pt-3.5 text-sm">
        <div className="flex items-center justify-between text-muted">
          <span>Protocol fee</span>
          <span className="font-semibold text-positive">0% ($0.00)</span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Routing &amp; gas</span>
          <span className="font-mono text-foreground">Jupiter DEX • &lt;$0.01</span>
        </div>
      </div>

      {isExecuting && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft p-3.5 text-sm text-accent-strong">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              {status.step === "quoting" && "Routing across Jupiter..."}
              {status.step === "signing" && `Confirm in wallet: transaction ${status.batch}/${status.total}`}
              {status.step === "confirming" && `Confirming onchain: transaction ${status.batch}/${status.total}`}
            </span>
          </div>
        </div>
      )}

      {status.step === "error" && (
        <div className="mt-4 rounded-xl border border-negative/30 bg-negative-soft p-3.5 text-sm text-negative">
          {status.message}
        </div>
      )}

      {status.step === "confirmed" && (
        <div className="mt-4 rounded-xl border border-positive/30 bg-positive-soft p-3.5 text-sm text-positive space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold">
            <CheckIcon className="h-2.5 w-2.5" />
            <span>Transaction confirmed on Solana</span>
          </div>
          <p className="text-xs text-positive/90">Minted proportional basket tokens into your linked wallet.</p>
          {status.signatures.map((sig) => (
            <div
              key={sig}
              className="mt-1 flex items-center justify-between font-mono text-xs text-positive/80 border-t border-positive/20 pt-1.5"
            >
              <span>Tx: {sig.slice(0, 8)}…{sig.slice(-8)}</span>
              <a
                href={`https://solscan.io/tx/${sig}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline cursor-pointer"
              >
                View on Solscan
                <ExternalLinkIcon className="h-2 w-2" />
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        {signedIn && !walletLinked ? (
          <div className="rounded-xl border border-accent/20 bg-accent-soft p-4">
            <p className="text-sm leading-relaxed text-accent-strong">
              Connect your Solana wallet to execute onchain orders with real tokens.
            </p>
            <button
              onClick={linkWallet}
              className="mt-3 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-[0.98]"
            >
              Connect Solana wallet
            </button>
          </div>
        ) : (
          <button
            onClick={handleBuyClick}
            disabled={amountNum <= 0 || isExecuting}
            className="w-full rounded-xl bg-accent py-3 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            {isExecuting
              ? "Executing on Solana..."
              : signedIn
              ? `Buy basket for ${currency === "USDC" ? `$${amountNum}` : `${amountNum} SOL`}`
              : "Sign in to buy"}
          </button>
        )}
      </div>
    </div>
  );
}

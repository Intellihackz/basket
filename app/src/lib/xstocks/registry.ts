import assetsData from "./data/assets.json";

/**
 * xStocks (Backed Finance) registry — tokenized equities/ETFs live on Solana mainnet.
 *
 * Source of truth: the official xStocks API (https://api.xstocks.fi/api/v2/public/assets),
 * not hand-typed. Synced 2026-09-12 via `scripts/sync-xstocks.py`, filtered to assets with
 * a Solana deployment that supports atomic swaps (798 of them). Re-run that script to
 * refresh — do not hand-edit `data/assets.json`.
 *
 * These are Token-2022 mints (owner program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb),
 * not classic SPL Token mints — confirmed by direct getAccountInfo checks against mainnet
 * on a sample (AAPLx, NVDAx, TSLAx, SPYx, Vx) before this switch to the official API.
 */

export type XStock = {
  /** on-chain ticker, e.g. "AAPLx" */
  symbol: string;
  /** real-world ticker, e.g. "AAPL" */
  underlyingSymbol: string;
  name: string;
  mint: string;
  logo: string | null;
  isTradingHalted: boolean;
};

export const XSTOCKS: XStock[] = assetsData as XStock[];

export function findXStock(underlyingSymbol: string): XStock | undefined {
  const q = underlyingSymbol.toLowerCase();
  return XSTOCKS.find((s) => s.underlyingSymbol.toLowerCase() === q || s.symbol.toLowerCase() === q);
}

export function searchXStocks(query: string, limit = 8): XStock[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return XSTOCKS.filter(
    (s) =>
      !s.isTradingHalted &&
      (s.underlyingSymbol.toLowerCase().includes(q) ||
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q))
  ).slice(0, limit);
}

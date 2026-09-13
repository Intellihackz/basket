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

// High-speed O(1) map indexed by both underlying ticker (AAPL) and onchain ticker (AAPLx)
const SYMBOL_MAP = new Map<string, XStock>();
XSTOCKS.forEach((stock) => {
  if (stock.underlyingSymbol) {
    SYMBOL_MAP.set(stock.underlyingSymbol.toUpperCase(), stock);
  }
  if (stock.symbol) {
    SYMBOL_MAP.set(stock.symbol.toUpperCase(), stock);
  }
});

export function findXStock(symbolOrUnderlying: string): XStock | undefined {
  if (!symbolOrUnderlying) return undefined;
  const upper = symbolOrUnderlying.trim().toUpperCase();
  return (
    SYMBOL_MAP.get(upper) ||
    (upper.endsWith("X") ? SYMBOL_MAP.get(upper.slice(0, -1)) : undefined)
  );
}

const MINT_MAP = new Map<string, XStock>(XSTOCKS.map((stock) => [stock.mint, stock]));

export function findXStockByMint(mint: string): XStock | undefined {
  return MINT_MAP.get(mint);
}

export const POPULAR_TICKERS = [
  "NVDA",
  "AAPL",
  "MSFT",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "TSM",
  "AMD",
  "AVGO",
  "COIN",
  "PLTR",
  "MSTR",
  "SPY",
  "QQQ",
  "RKLB",
];

export function getPopularXStocks(): XStock[] {
  return POPULAR_TICKERS.map((sym) => findXStock(sym)).filter(Boolean) as XStock[];
}

export function searchXStocks(query: string, limit = 12): XStock[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const activeOnly = XSTOCKS.filter((s) => !s.isTradingHalted);

  const exactMatch: XStock[] = [];
  const prefixMatch: XStock[] = [];
  const containsMatch: XStock[] = [];

  for (const s of activeOnly) {
    const sym = (s.underlyingSymbol || "").toUpperCase();
    const onchain = (s.symbol || "").toUpperCase();
    const name = (s.name || "").toUpperCase();

    if (sym === q || onchain === q) {
      exactMatch.push(s);
    } else if (sym.startsWith(q) || onchain.startsWith(q)) {
      prefixMatch.push(s);
    } else if (sym.includes(q) || onchain.includes(q) || name.includes(q)) {
      containsMatch.push(s);
    }
  }

  return [...exactMatch, ...prefixMatch, ...containsMatch].slice(0, limit);
}

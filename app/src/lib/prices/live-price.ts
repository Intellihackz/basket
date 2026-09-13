import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getQuote, USDC_MINT } from "@/lib/jupiter/client";
import { getConnection } from "@/lib/solana/connection";

// Decimals never change for a given mint — cache indefinitely.
const decimalsCache = new Map<string, number>();
// Prices move — cache briefly so a page render doesn't refire N Jupiter quotes per asset.
const priceCache = new Map<string, { price: number; at: number }>();
const PRICE_TTL_MS = 20_000;

async function getDecimals(connection: Connection, mint: string): Promise<number> {
  const cached = decimalsCache.get(mint);
  if (cached !== undefined) return cached;
  const info = await getMint(connection, new PublicKey(mint), "confirmed", TOKEN_2022_PROGRAM_ID);
  decimalsCache.set(mint, info.decimals);
  return info.decimals;
}

/** Real, live spot price in USD for one whole token, quoted against USDC via Jupiter. */
export async function getLivePriceUsd(mint: string): Promise<number | null> {
  const cached = priceCache.get(mint);
  if (cached && Date.now() - cached.at < PRICE_TTL_MS) return cached.price;

  try {
    const connection = getConnection();
    const decimals = await getDecimals(connection, mint);
    const quote = await getQuote({
      inputMint: mint,
      outputMint: USDC_MINT,
      amount: 10 ** decimals,
      slippageBps: 50,
    });
    const price = Number(quote.outAmount) / 1_000_000; // USDC has 6 decimals
    priceCache.set(mint, { price, at: Date.now() });
    return price;
  } catch {
    return null; // no route / RPC hiccup — caller decides how to show "unavailable"
  }
}

/** Batches live prices for many mints in parallel. Failed lookups are simply absent from the result. */
export async function getLivePrices(mints: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(mints));
  const results = await Promise.all(unique.map(async (mint) => [mint, await getLivePriceUsd(mint)] as const));
  const out: Record<string, number> = {};
  for (const [mint, price] of results) {
    if (price !== null) out[mint] = price;
  }
  return out;
}

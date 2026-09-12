#!/usr/bin/env node
/**
 * Refreshes src/lib/xstocks/data/assets.json from the official xStocks API
 * (https://api.xstocks.fi/api/v2/public/assets). Run with:
 *
 *   node scripts/sync-xstocks.mjs
 *
 * Filters to assets that have a Solana deployment supporting atomic swaps
 * (i.e. actually routable through Jupiter against USDC on Solana).
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE = "https://api.xstocks.fi/api/v2/public/assets";
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/lib/xstocks/data/assets.json"
);

async function fetchAllPages() {
  const nodes = [];
  let page = 0;
  for (;;) {
    const url = `${BASE}?supportsAtomicSwaps=true&network=Solana&page=${page}&pageSize=100`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`xStocks API returned ${res.status} on page ${page}`);
    const data = await res.json();
    nodes.push(...data.nodes);
    console.log(`page ${page}: ${data.nodes.length} nodes, hasNextPage=${data.page.hasNextPage}`);
    if (!data.page.hasNextPage) break;
    page += 1;
    await new Promise((r) => setTimeout(r, 400)); // be polite
  }
  return nodes;
}

function trim(nodes) {
  return nodes
    .map((n) => {
      const sol = n.deployments?.find((d) => d.network === "Solana");
      if (!sol) return null;
      return {
        symbol: n.symbol,
        underlyingSymbol: n.underlyingSymbol,
        name: n.name,
        mint: sol.address,
        logo: n.logo ?? null,
        isTradingHalted: Boolean(n.isTradingHalted),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.underlyingSymbol.localeCompare(b.underlyingSymbol));
}

const nodes = await fetchAllPages();
const trimmed = trim(nodes);
await writeFile(OUT, JSON.stringify(trimmed, null, 2) + "\n");
console.log(`\nWrote ${trimmed.length} assets to ${OUT}`);

import { XSTOCKS, findXStock } from "@/lib/xstocks/registry";

export type Asset = {
  symbol: string;
  name: string;
  weightBps: number; // basis points, sums to 10_000 per index
  mint?: string;
  isTradingHalted?: boolean;
};

export type PricePoint = { date: string; value: number };

export type IndexSummary = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  creatorUsername: string;
  assets: Asset[];
  totalValueUsd: number;
  holders: number;
  return30d: number; // percent
  return90d: number;
  returnInception: number;
  createdAt: string;
  history: PricePoint[];
  benchmarkName?: string;
  benchmarkReturn30d?: number;
};

export type Profile = {
  username: string;
  bio: string;
  walletLinked: boolean;
  walletShort?: string;
};

function history(seed: number, days: number, drift: number): PricePoint[] {
  const points: PricePoint[] = [];
  let value = 100;
  for (let i = days; i >= 0; i--) {
    const noise = Math.sin(seed + i * 0.7) * 1.8;
    value += drift + noise * 0.4;
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({ date: d.toISOString().slice(0, 10), value: Math.max(40, value) });
  }
  return points;
}

export const CATEGORIES = [
  "All",
  "AI & Compute",
  "Robotics",
  "Mega-Cap Tech",
  "Clean Energy",
  "Space & Frontier",
  "Value & Dividends",
] as const;

export const indexes: IndexSummary[] = [
  {
    id: "ai-infrastructure",
    slug: "ai-infrastructure",
    name: "AI Infrastructure",
    category: "AI & Compute",
    description:
      "The companies powering the next generation of AI — compute, chips, and the fabs behind them.",
    creatorUsername: "zed",
    assets: [
      { symbol: "NVDA", name: "NVIDIA Corp", weightBps: 3500 },
      { symbol: "TSM", name: "Taiwan Semiconductor", weightBps: 2500 },
      { symbol: "AMD", name: "Advanced Micro Devices", weightBps: 2000 },
      { symbol: "AVGO", name: "Broadcom Inc", weightBps: 2000 },
    ],
    totalValueUsd: 84291,
    holders: 1284,
    return30d: 18.4,
    return90d: 42.1,
    returnInception: 76.8,
    createdAt: "2026-04-02",
    history: history(1, 90, 0.42),
    benchmarkName: "S&P 500",
    benchmarkReturn30d: 4.2,
  },
  {
    id: "robotics-revolution",
    slug: "robotics-revolution",
    name: "Robotics Revolution",
    category: "Robotics",
    description: "Industrial and consumer robotics — the arms and legs of the automation wave.",
    creatorUsername: "mkim",
    assets: [
      { symbol: "TSLA", name: "Tesla Inc", weightBps: 4000 },
      { symbol: "NVDA", name: "NVIDIA Corp", weightBps: 3000 },
      { symbol: "ROK", name: "Rockwell Automation", weightBps: 1500 },
      { symbol: "ISRG", name: "Intuitive Surgical", weightBps: 1500 },
    ],
    totalValueUsd: 51230,
    holders: 734,
    return30d: 14.2,
    return90d: 29.6,
    returnInception: 55.3,
    createdAt: "2026-05-14",
    history: history(2, 90, 0.33),
    benchmarkName: "Nasdaq 100",
    benchmarkReturn30d: 5.8,
  },
  {
    id: "big-tech-10",
    slug: "big-tech-10",
    name: "Big Tech 10",
    category: "Mega-Cap Tech",
    description: "The ten largest US technology companies, equal-conviction, no single bet.",
    creatorUsername: "sarah.eth",
    assets: [
      { symbol: "AAPL", name: "Apple Inc", weightBps: 1200 },
      { symbol: "MSFT", name: "Microsoft Corp", weightBps: 1200 },
      { symbol: "GOOGL", name: "Alphabet Inc", weightBps: 1100 },
      { symbol: "AMZN", name: "Amazon.com Inc", weightBps: 1100 },
      { symbol: "META", name: "Meta Platforms", weightBps: 1000 },
      { symbol: "NVDA", name: "NVIDIA Corp", weightBps: 1000 },
      { symbol: "TSLA", name: "Tesla Inc", weightBps: 900 },
      { symbol: "AVGO", name: "Broadcom Inc", weightBps: 900 },
      { symbol: "CRM", name: "Salesforce Inc", weightBps: 800 },
      { symbol: "ORCL", name: "Oracle Corp", weightBps: 800 },
    ],
    totalValueUsd: 312840,
    holders: 3921,
    return30d: 11.8,
    return90d: 24.4,
    returnInception: 61.0,
    createdAt: "2026-02-20",
    history: history(3, 90, 0.28),
    benchmarkName: "S&P 500",
    benchmarkReturn30d: 4.2,
  },
  {
    id: "nuclear-future",
    slug: "nuclear-future",
    name: "Nuclear Future",
    category: "Clean Energy",
    description: "Uranium miners and the utilities betting on nuclear for baseload AI power demand.",
    creatorUsername: "zed",
    assets: [
      { symbol: "URA", name: "Global X Uranium ETF", weightBps: 4000 },
      { symbol: "NLR", name: "VanEck Uranium and Nuclear", weightBps: 3000 },
      { symbol: "NEE", name: "NextEra Energy", weightBps: 3000 },
    ],
    totalValueUsd: 19870,
    holders: 421,
    return30d: 9.7,
    return90d: 15.2,
    returnInception: 22.9,
    createdAt: "2026-06-30",
    history: history(4, 90, 0.19),
    benchmarkName: "Energy Select ETF",
    benchmarkReturn30d: 3.1,
  },
  {
    id: "space-economy",
    slug: "space-economy",
    name: "Space Economy",
    category: "Space & Frontier",
    description: "Launch, satellites, and the infra for an orbital economy still in its first innings.",
    creatorUsername: "mkim",
    assets: [
      { symbol: "RKLB", name: "Rocket Lab USA", weightBps: 4500 },
      { symbol: "GE", name: "GE Aerospace", weightBps: 3000 },
      { symbol: "SPCX", name: "SpaceX", weightBps: 2500 },
    ],
    totalValueUsd: 12450,
    holders: 268,
    return30d: -4.3,
    return90d: 6.1,
    returnInception: 18.7,
    createdAt: "2026-07-11",
    history: history(5, 90, 0.08),
    benchmarkName: "Russell 2000",
    benchmarkReturn30d: 1.4,
  },
  {
    id: "dividend-kings",
    slug: "dividend-kings",
    name: "Dividend Kings",
    category: "Value & Dividends",
    description: "Boring on purpose — decades of consecutive dividend growth, nothing speculative.",
    creatorUsername: "sarah.eth",
    assets: [
      { symbol: "KO", name: "Coca-Cola Co", weightBps: 3500 },
      { symbol: "JNJ", name: "Johnson & Johnson", weightBps: 3500 },
      { symbol: "PG", name: "Procter & Gamble", weightBps: 3000 },
    ],
    totalValueUsd: 8340,
    holders: 156,
    return30d: 2.1,
    return90d: 5.8,
    returnInception: 9.4,
    createdAt: "2026-08-01",
    history: history(6, 90, 0.06),
    benchmarkName: "S&P Dividend ETF",
    benchmarkReturn30d: 1.8,
  },
];

export const profiles: Record<string, Profile> = {
  zed: {
    username: "zed",
    bio: "Building indexes around infrastructure theses — chips, power, the physical layer of AI.",
    walletLinked: true,
    walletShort: "7xKX...9fQ2",
  },
  mkim: {
    username: "mkim",
    bio: "Robotics and space. If it has a motor or a rocket, I'm probably watching it.",
    walletLinked: true,
    walletShort: "3nRp...B4Lk",
  },
  "sarah.eth": {
    username: "sarah.eth",
    bio: "Two speeds: mega-cap tech and boring dividend compounding. No in-between.",
    walletLinked: false,
  },
};

export type AssetDetail = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change24h: number;
  logo?: string | null;
  mint?: string;
  isTradingHalted?: boolean;
};

// Curated seed baseline details for prominent assets
const BASE_PRICES: Record<string, { price: number; change24h: number; sector: string }> = {
  NVDA: { price: 128.4, change24h: 3.8, sector: "AI & Compute" },
  AAPL: { price: 224.1, change24h: 0.9, sector: "Consumer Hardware" },
  MSFT: { price: 432.5, change24h: 1.4, sector: "Enterprise Cloud" },
  NFLX: { price: 684.2, change24h: 2.1, sector: "Streaming Media" },
  TSLA: { price: 248.8, change24h: 2.1, sector: "Robotics & EV" },
  TSM: { price: 174.2, change24h: 4.1, sector: "Semiconductor Foundry" },
  AMD: { price: 152.6, change24h: 1.8, sector: "AI Processors" },
  AVGO: { price: 168.9, change24h: 2.7, sector: "Custom Silicon" },
  GOOGL: { price: 182.3, change24h: 1.1, sector: "AI & Cloud" },
  AMZN: { price: 188.4, change24h: 1.5, sector: "Cloud & Commerce" },
  META: { price: 512.7, change24h: 2.9, sector: "Social & AI" },
  CRM: { price: 254.1, change24h: -0.4, sector: "Enterprise SaaS" },
  ORCL: { price: 142.8, change24h: 1.6, sector: "Cloud Infrastructure" },
  ROK: { price: 295.4, change24h: 1.5, sector: "Industrial Automation" },
  ISRG: { price: 486.0, change24h: 1.7, sector: "Medical Robotics" },
  URA: { price: 31.4, change24h: 3.4, sector: "Nuclear Fuels" },
  NLR: { price: 82.6, change24h: 2.8, sector: "Uranium & Nuclear" },
  NEE: { price: 78.1, change24h: 0.8, sector: "Clean Baseload" },
  RKLB: { price: 14.8, change24h: -1.2, sector: "Orbital Launch" },
  GE: { price: 182.5, change24h: 1.9, sector: "Aerospace & Defense" },
  SPCX: { price: 310.0, change24h: 6.8, sector: "Space Exploration" },
  KO: { price: 69.4, change24h: 0.4, sector: "Consumer Staples" },
  JNJ: { price: 162.1, change24h: 0.2, sector: "Healthcare & Pharma" },
  PG: { price: 172.5, change24h: 0.5, sector: "Consumer Staples" },
  PLTR: { price: 34.2, change24h: 4.6, sector: "Enterprise AI" },
  COIN: { price: 218.0, change24h: 5.2, sector: "Crypto Economy" },
  MSTR: { price: 145.2, change24h: 7.1, sector: "Bitcoin Treasury" },
  SPY: { price: 565.0, change24h: 0.7, sector: "Broad Market Index" },
  QQQ: { price: 490.0, change24h: 1.1, sector: "Tech 100 Index" },
};

export function getAssetDetail(symbolOrUnderlying: string): AssetDetail {
  const clean = symbolOrUnderlying.trim();
  const xstock = findXStock(clean);
  const upper = clean.toUpperCase();
  const base = BASE_PRICES[upper] || BASE_PRICES[upper.replace(/X$/, "")];

  if (xstock) {
    let hash = 0;
    for (let i = 0; i < xstock.symbol.length; i++) {
      hash = (hash << 5) - hash + xstock.symbol.charCodeAt(i);
      hash |= 0;
    }
    const seedPrice = Math.abs(hash % 400) + 40 + Math.abs(hash % 90) / 100;
    const seedChange = (hash % 80) / 10;

    return {
      symbol: xstock.underlyingSymbol,
      name: xstock.name,
      sector: base?.sector || "Tokenized Equity",
      price: base?.price || Number(seedPrice.toFixed(2)),
      change24h: base?.change24h ?? Number(seedChange.toFixed(1)),
      logo: xstock.logo,
      mint: xstock.mint,
      isTradingHalted: xstock.isTradingHalted,
    };
  }

  return {
    symbol: clean,
    name: base ? clean : `${clean} Token`,
    sector: base?.sector || "Tokenized Asset",
    price: base?.price || 100.0,
    change24h: base?.change24h ?? 0.0,
  };
}

// Proxied ASSET_METADATA dynamically resolves any of the 798 real xStocks
export const ASSET_METADATA: Record<string, AssetDetail> = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (typeof prop !== "string" || prop === "then") return undefined;
      return getAssetDetail(prop);
    },
    has(_target, prop: string) {
      if (typeof prop !== "string") return false;
      return Boolean(findXStock(prop) || BASE_PRICES[prop.toUpperCase()]);
    },
    ownKeys() {
      return XSTOCKS.map((s) => s.underlyingSymbol);
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
  }
);

export const MARKET_TICKER_ITEMS = [
  { symbol: "NVDA", price: 128.4, change: 3.8 },
  { symbol: "TSLA", price: 248.8, change: 2.1 },
  { symbol: "AAPL", price: 224.1, change: 0.9 },
  { symbol: "TSM", price: 174.2, change: 4.1 },
  { symbol: "MSFT", price: 432.5, change: 1.4 },
  { symbol: "SPCX", price: 310.0, change: 6.8 },
  { symbol: "URA", price: 31.4, change: 3.4 },
  { symbol: "RKLB", price: 14.8, change: -1.2 },
  { symbol: "SOL/USD", price: 154.2, change: 4.5 },
];

export const availableAssets: {
  symbol: string;
  name: string;
  mint: string;
  logo: string | null;
}[] = XSTOCKS.filter((s) => !s.isTradingHalted).map((s) => ({
  symbol: s.underlyingSymbol,
  name: s.name,
  mint: s.mint,
  logo: s.logo,
}));


export function getIndexById(id: string): IndexSummary | undefined {
  return indexes.find((i) => i.id === id);
}

export function getIndexesByCreator(username: string): IndexSummary[] {
  return indexes.filter((i) => i.creatorUsername === username);
}

export function formatUsd(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatUsdFull(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export type Position = {
  indexId: string;
  invested: number;
  currentValue: number;
  purchasedAt: string;
  shares: number;
};

export const defaultHoldings: Position[] = [
  { indexId: "ai-infrastructure", invested: 1200, currentValue: 1420.8, purchasedAt: "2026-05-10", shares: 12 },
  { indexId: "big-tech-10", invested: 800, currentValue: 894.4, purchasedAt: "2026-06-01", shares: 8 },
  { indexId: "space-economy", invested: 300, currentValue: 287.1, purchasedAt: "2026-07-20", shares: 3 },
];

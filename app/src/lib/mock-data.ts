export type Asset = {
  symbol: string;
  name: string;
  weightBps: number; // basis points, sums to 10_000 per index
  mint?: string;
  isTradingHalted?: boolean;
};

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
  return `${sign}${value.toFixed(2)}%`;
}

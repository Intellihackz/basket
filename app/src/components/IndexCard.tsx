import Link from "next/link";
import type { PublicIndex } from "@/lib/db/index-stats";
import Avatar from "@/components/Avatar";
import { CompanyLogo } from "@/components/TickerChip";

function formatReturn(pct: number | null): string {
  if (pct === null) return "N/A";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

const TINTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

function TrendGlyph({ positive }: { positive: boolean }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="shrink-0">
      <path
        d={positive ? "M5 1.5V8.5M5 1.5L1.5 5M5 1.5L8.5 5" : "M5 8.5V1.5M5 8.5L1.5 5M5 8.5L8.5 5"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function IndexCard({
  index,
  featured = false,
}: {
  index: PublicIndex;
  featured?: boolean;
}) {
  const positive = (index.returnSincePublishPct ?? 0) >= 0;
  const logoCount = featured ? 4 : 3;
  const shownLogos = index.assets.slice(0, logoCount);
  const pillTickers = index.assets.slice(0, featured ? 4 : 3);

  return (
    <Link
      href={`/index/${index.id}`}
      className={`group flex flex-col rounded-2xl border border-border-subtle bg-surface transition-all duration-200 hover:border-accent hover:shadow-[0_1px_2px_rgb(var(--shadow-color)/0.04),0_16px_32px_-12px_rgb(var(--shadow-color)/0.16)] ${
        featured ? "p-7 sm:p-8" : "p-7"
      }`}
    >
      {/* Logo cluster panel */}
      <div
        className={`relative flex items-center overflow-hidden rounded-xl ${featured ? "p-7" : "p-6"}`}
        style={{ backgroundColor: `color-mix(in srgb, ${tintFor(index.id)} 14%, var(--surface-hover))` }}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden pr-20">
          {shownLogos.map((asset) => (
            <CompanyLogo
              key={asset.symbol}
              symbol={asset.symbol}
              size={featured ? 64 : 56}
              className="shrink-0"
            />
          ))}
          {index.assets.length > shownLogos.length && (
            <span className="shrink-0 font-mono text-sm text-muted">
              +{index.assets.length - shownLogos.length}
            </span>
          )}
        </div>

        {index.returnSincePublishPct !== null && (
          <span
            className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-sm font-semibold tabular-nums ${
              positive ? "text-positive" : "text-negative"
            }`}
          >
            <TrendGlyph positive={positive} />
            {formatReturn(index.returnSincePublishPct)}
          </span>
        )}
      </div>

      {/* Title + creator */}
      <h3
        className={`font-display mt-5 font-medium leading-tight tracking-tight text-foreground ${
          featured ? "text-3xl sm:text-4xl" : "text-2xl"
        }`}
      >
        {index.name}
      </h3>
      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted">
        <Avatar username={index.creatorUsername} size={18} />
        <span>@{index.creatorUsername}</span>
      </div>

      <p className={`mt-2.5 line-clamp-2 text-base leading-relaxed text-muted ${featured ? "sm:max-w-lg" : ""}`}>
        {index.description}
      </p>

      {/* Pill row */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {pillTickers.map((asset) => (
          <span
            key={asset.symbol}
            className="rounded-lg bg-surface-hover px-3 py-1.5 font-mono text-sm font-medium text-foreground"
          >
            {asset.symbol}
          </span>
        ))}
        <span className="rounded-lg bg-surface-hover px-3 py-1.5 text-sm font-medium text-muted">
          {index.holders.toLocaleString()} {index.holders === 1 ? "investor" : "investors"}
        </span>
      </div>
    </Link>
  );
}

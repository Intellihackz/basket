import Link from "next/link";
import type { PublicIndex } from "@/lib/db/index-stats";
import { formatUsd } from "@/lib/mock-data";
import Avatar from "@/components/Avatar";
import { CompanyLogo } from "@/components/TickerChip";

function formatReturn(pct: number | null): string {
  if (pct === null) return "N/A";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export default function IndexCard({
  index,
  featured = false,
}: {
  index: PublicIndex;
  featured?: boolean;
}) {
  const positive = (index.returnSincePublishPct ?? 0) >= 0;

  return (
    <Link
      href={`/index/${index.id}`}
      className={`elevated elevated-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-surface transition-all duration-200 ${
        featured ? "p-6 sm:p-8" : "p-5"
      }`}
    >
      <div className="relative z-10">
        {/* Top stocks count & return badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md border border-border-subtle bg-background px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-muted">
            {index.assets.length} stocks
          </span>
          {index.returnSincePublishPct !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                positive
                  ? "bg-positive-soft text-positive border border-positive/20"
                  : "bg-negative-soft text-negative border border-negative/20"
              }`}
            >
              <span>{positive ? "↗" : "↘"}</span>
              {formatReturn(index.returnSincePublishPct)}
              <span className="font-normal opacity-75 text-[10px]">since publish</span>
            </span>
          )}
        </div>

        {/* Title & Creator */}
        <div className="mt-3.5">
          <h3
            className={`font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent-strong ${
              featured ? "text-2xl sm:text-3xl" : "text-lg"
            }`}
          >
            {index.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
            <Avatar username={index.creatorUsername} size={featured ? 22 : 18} />
            <span>by @{index.creatorUsername}</span>
          </div>
        </div>

        {/* Thesis description */}
        <p
          className={`mt-2.5 leading-relaxed text-muted line-clamp-2 ${
            featured ? "text-sm sm:max-w-xl line-clamp-3" : "text-xs"
          }`}
        >
          {index.description}
        </p>

        {/* Top Constituent Assets Preview */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {index.assets.slice(0, featured ? 5 : 3).map((asset) => (
            <span
              key={asset.symbol}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle/80 bg-background/90 px-2 py-1 text-[11px] font-mono text-muted shadow-2xs"
            >
              <CompanyLogo symbol={asset.symbol} size={15} />
              <span className="font-semibold text-foreground">{asset.symbol}</span>
              <span className="opacity-75">{(asset.weightBps / 100).toFixed(0)}%</span>
            </span>
          ))}
          {index.assets.length > (featured ? 5 : 3) && (
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] text-muted">
              +{index.assets.length - (featured ? 5 : 3)} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-border-subtle/60 pt-3 text-xs">
        <div>
          <span className="text-[11px] text-muted">Invested</span>
          <p className="font-semibold tabular-nums text-foreground">{formatUsd(index.totalInvestedUsd)}</p>
        </div>

        <div className="text-center">
          <span className="text-[11px] text-muted">Holders</span>
          <p className="font-semibold tabular-nums text-foreground">{index.holders.toLocaleString()}</p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-muted">Since publish</span>
          <p
            className={`font-semibold tabular-nums ${
              (index.returnSincePublishPct ?? 0) >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {formatReturn(index.returnSincePublishPct)}
          </p>
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { indexes } from "@/lib/db/schema";
import { hydrateIndexes } from "@/lib/db/index-stats";
import { formatUsdFull } from "@/lib/mock-data";
import { findXStock } from "@/lib/xstocks/registry";
import AllocationBar from "@/components/AllocationBar";
import BuyPanel from "@/components/BuyPanel";
import Avatar from "@/components/Avatar";

function formatReturn(pct: number | null): string {
  if (pct === null) return "Not enough live price data yet";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export default async function IndexDetailPage(props: PageProps<"/index/[id]">) {
  const { id } = await props.params;
  const rows = await db.select().from(indexes).where(eq(indexes.id, id));
  if (rows.length === 0) notFound();
  const [index] = await hydrateIndexes(rows);
  const displayAssets = index.assets.map((a) => ({
    ...a,
    name: findXStock(a.symbol)?.name ?? a.symbol,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Navigation */}
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <span>←</span>
          <span>Explore Baskets</span>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          {/* Strategy Title & Attribution */}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <Link
                href={`/u/${index.creatorUsername}`}
                className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-accent-strong"
              >
                <Avatar username={index.creatorUsername} size={18} />
                <span>@{index.creatorUsername}</span>
              </Link>
              <span>•</span>
              <span>Published {new Date(index.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{index.holders.toLocaleString()} backers</span>
            </div>

            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {index.name}
            </h1>

            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted">
              {index.description}
            </p>
          </div>

          {/* Key Financial Metrics Strip */}
          <div className="mt-6 grid grid-cols-2 gap-y-4 rounded-xl border border-border-subtle bg-surface/50 p-4 sm:grid-cols-3 sm:p-5 sm:divide-x divide-border-subtle/70">
            <div className="sm:pr-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Total Invested</p>
              <p className="mt-1 font-display text-base font-bold text-foreground sm:text-lg">
                {formatUsdFull(index.totalInvestedUsd)}
              </p>
            </div>
            <div className="sm:px-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Backers</p>
              <p className="mt-1 font-display text-base font-bold text-foreground sm:text-lg">
                {index.holders.toLocaleString()}
              </p>
            </div>
            <div className="sm:pl-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Since Publish</p>
              <p
                className={`mt-1 font-display text-base font-bold sm:text-lg ${
                  index.returnSincePublishPct === null
                    ? "text-muted text-sm"
                    : index.returnSincePublishPct >= 0
                    ? "text-positive"
                    : "text-negative"
                }`}
              >
                {formatReturn(index.returnSincePublishPct)}
              </p>
            </div>
          </div>

          {/* Constituent Holdings Section */}
          <div className="mt-10">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                  Constituent Holdings
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {index.assets.length} tokenized equities · the whole manifest, nothing pooled
                </p>
              </div>
              <span className="font-mono text-xs text-muted">100% Target Weight</span>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-xs">
              <AllocationBar assets={displayAssets} livePrices={index.livePricesUsd} />
            </div>
          </div>
        </div>

        {/* Sticky Buy & Invest Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BuyPanel indexId={index.id} assets={displayAssets} />
        </div>
      </div>
    </div>
  );
}

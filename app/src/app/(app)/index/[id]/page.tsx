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
import BasketReturnChart from "@/components/BasketReturnChart";

function formatReturn(pct: number | null): string {
  if (pct === null) return "Not enough live price data yet";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
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
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
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
            <span>{index.holders.toLocaleString()} investors</span>
          </div>

          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {index.name}
          </h1>

          <p className="mt-2.5 max-w-2xl text-base leading-relaxed text-muted">{index.description}</p>

          {/* Key stats */}
          <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-y border-border-subtle py-5">
            <div>
              <p className="font-display text-2xl font-medium tabular-nums text-foreground">
                {formatUsdFull(index.totalInvestedUsd)}
              </p>
              <p className="text-sm text-muted">total invested</p>
            </div>
            <div>
              <p className="font-display text-2xl font-medium tabular-nums text-foreground">
                {index.holders.toLocaleString()}
              </p>
              <p className="text-sm text-muted">investors</p>
            </div>
            <div>
              <p
                className={`font-display text-2xl font-medium tabular-nums ${
                  index.returnSincePublishPct === null
                    ? "text-sm text-muted"
                    : index.returnSincePublishPct >= 0
                    ? "text-positive"
                    : "text-negative"
                }`}
              >
                {formatReturn(index.returnSincePublishPct)}
              </p>
              <p className="text-sm text-muted">since publish</p>
            </div>
          </div>

          {/* Return since publish */}
          <div className="mt-8">
            <h2 className="font-display text-xl font-medium tracking-tight text-foreground mb-4">
              Return since publish
            </h2>
            <BasketReturnChart publishedAt={index.createdAt} returnSincePublishPct={index.returnSincePublishPct} />
          </div>

          {/* Holdings */}
          <div className="mt-8">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-medium tracking-tight text-foreground">Holdings</h2>
              <span className="font-mono text-xs text-muted">
                {index.assets.length} {index.assets.length === 1 ? "asset" : "assets"}
              </span>
            </div>

            <AllocationBar
              assets={displayAssets}
              livePrices={index.livePricesUsd}
              assetReturns={index.assetReturnsPct}
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <BuyPanel indexId={index.id} assets={displayAssets} />
        </div>
      </div>
    </div>
  );
}

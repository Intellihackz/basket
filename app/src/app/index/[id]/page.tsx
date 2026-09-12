import Link from "next/link";
import { notFound } from "next/navigation";
import { getIndexById, formatPercent, formatUsdFull } from "@/lib/mock-data";
import AllocationBar from "@/components/AllocationBar";
import PerformanceChart from "@/components/PerformanceChart";
import BuyPanel from "@/components/BuyPanel";
import Avatar from "@/components/Avatar";

export default async function IndexDetailPage(props: PageProps<"/index/[id]">) {
  const { id } = await props.params;
  const index = getIndexById(id);
  if (!index) notFound();

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
              <span>Launched {index.createdAt}</span>
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

          {/* Performance Chart Card */}
          <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-xs">
            <PerformanceChart history={index.history} benchmarkName={index.benchmarkName || "S&P 500"} />
          </div>

          {/* Key Financial Metrics Strip */}
          <div className="mt-5 grid grid-cols-2 gap-y-4 rounded-xl border border-border-subtle bg-surface/50 p-4 sm:grid-cols-4 sm:p-5 sm:divide-x divide-border-subtle/70">
            <div className="sm:pr-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">AUM Backed</p>
              <p className="mt-1 font-display text-base font-bold text-foreground sm:text-lg">
                {formatUsdFull(index.totalValueUsd)}
              </p>
            </div>
            <div className="sm:px-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">30-Day Return</p>
              <p
                className={`mt-1 font-display text-base font-bold sm:text-lg ${
                  index.return30d >= 0 ? "text-positive" : "text-negative"
                }`}
              >
                {formatPercent(index.return30d)}
              </p>
            </div>
            <div className="sm:px-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">All-Time Gain</p>
              <p
                className={`mt-1 font-display text-base font-bold sm:text-lg ${
                  index.returnInception >= 0 ? "text-positive" : "text-negative"
                }`}
              >
                {formatPercent(index.returnInception)}
              </p>
            </div>
            <div className="sm:pl-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                vs {index.benchmarkName || "Benchmark"}
              </p>
              <p className="mt-1 font-display text-base font-bold text-positive sm:text-lg">
                +{(index.return30d - (index.benchmarkReturn30d || 0)).toFixed(1)}%
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
                  {index.assets.length} tokenized equities • Auto-rebalanced onchain
                </p>
              </div>
              <span className="font-mono text-xs text-muted">100% Target Weight</span>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-xs">
              <AllocationBar assets={index.assets} />
            </div>
          </div>
        </div>

        {/* Sticky Buy & Invest Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BuyPanel assets={index.assets} />
        </div>
      </div>
    </div>
  );
}


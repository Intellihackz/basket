"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import WeightEditor, { type DraftAsset } from "@/components/WeightEditor";
import Avatar from "@/components/Avatar";
import { chartColor } from "@/lib/chart-colors";
import { CompanyLogo } from "@/components/TickerChip";

export default function CreatePage() {
  const { signedIn, userId, username, avatarIndex, signIn } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assets, setAssets] = useState<DraftAsset[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = assets.reduce((sum, a) => sum + a.weight, 0);
  const canPublish = name.trim().length > 0 && assets.length > 0 && total === 100;

  async function handlePublish() {
    if (!signedIn || !userId) {
      signIn();
      return;
    }
    if (!canPublish) return;

    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/indexes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorUserId: userId,
          name: name.trim(),
          description: description.trim(),
          assets: assets.map((a) => ({ symbol: a.symbol, weightBps: a.weight * 100 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish index");
      router.push(`/index/${data.index.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish index");
      setPublishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Navigation & Header */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
      >
        <span aria-hidden>←</span> Explore Baskets
      </Link>

      <div className="mt-4 flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Index Studio
        </h1>
        <p className="text-sm text-muted">
          Design and curate a thematic strategy. No upfront capital needed to publish.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_390px]">
        {/* Left Column: Form & Weight Editor */}
        <div className="space-y-6">
          {/* Index Metadata Card */}
          <div className="elevated rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 space-y-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-foreground">1. Core Thesis</h2>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted">
                Index Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Next-Gen Robotics, Nuclear Renaissance, Cloud Titans"
                className="mt-1.5 w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-muted/70 focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted">
                Investment Thesis (Description)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your conviction: why this combination of companies, why now, and what macro trends back it..."
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm leading-relaxed outline-none transition-all placeholder:text-muted/70 focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Asset Allocation Card */}
          <div className="elevated rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-sm">
            <h2 className="font-display text-lg font-bold text-foreground">2. Asset Selection & Weights</h2>
            <p className="mt-1 text-xs text-muted mb-4">
              Select equities and allocate weights summing to 100%.
            </p>
            <WeightEditor assets={assets} onChange={setAssets} />
          </div>

          {/* Submit CTA */}
          <button
            onClick={handlePublish}
            disabled={publishing || (signedIn && !canPublish)}
            className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-foreground shadow-md transition-all duration-150 hover:bg-accent-strong hover:shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            {publishing
              ? "Publishing index..."
              : signedIn
              ? canPublish
                ? "Publish Index"
                : `Complete requirements (${total === 100 ? "enter name" : `needs ${100 - total}% allocation`})`
              : "Sign in to publish"}
          </button>
          {error && <p className="text-xs text-negative">{error}</p>}
        </div>

        {/* Right Column: Live Basket Card Preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Live Strategy Preview
            </span>
            <span className="rounded-md bg-positive-soft px-2 py-0.5 text-[10px] font-semibold text-positive">
              Instant Sync
            </span>
          </div>

          <div className="elevated overflow-hidden rounded-2xl border border-border-subtle bg-surface p-6 shadow-md">
            {/* Stock Count & Sim Return */}
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md border border-border-subtle bg-background px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted">
                {assets.length} {assets.length === 1 ? "stock" : "stocks"}
              </span>

              <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-strong">
                Draft
              </span>
            </div>

            {/* Title & Creator */}
            <div className="mt-4">
              <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {name.trim() || "Untitled Index Basket"}
              </h3>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                <Avatar
                  username={username || "curator"}
                  size={18}
                  styleIndex={avatarIndex}
                />
                <span>by @{username || "curator"}</span>
              </div>
            </div>

            {/* Thesis description */}
            <p className="mt-3 text-xs leading-relaxed text-muted line-clamp-3 italic">
              {description.trim()
                ? `“${description}”`
                : "“Your thesis description will appear here to help backers understand your market thesis.”"}
            </p>

            {/* Live Segmented Composition Bar */}
            <div className="mt-5 border-t border-border-subtle/80 pt-4">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>Basket Composition</span>
                <span className="font-mono font-medium">{assets.length} assets ({total}%)</span>
              </div>

              {assets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle py-6 text-center text-xs text-muted">
                  Search & select equities on the left
                </div>
              ) : (
                <>
                  <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-md bg-background shadow-2xs">
                    {assets.map((a, i) => (
                      <div
                        key={a.symbol}
                        className="h-full rounded-sm transition-all"
                        style={{
                          width: `${total > 0 ? (a.weight / total) * 100 : 0}%`,
                          backgroundColor: chartColor(i),
                        }}
                        title={`${a.symbol} ${a.weight}%`}
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {assets.map((a) => (
                      <span
                        key={a.symbol}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-background px-2 py-1 text-[11px] font-mono shadow-2xs"
                      >
                        <CompanyLogo symbol={a.symbol} size={15} />
                        <span className="font-bold text-foreground">{a.symbol}</span>
                        <span className="text-muted">{a.weight}%</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}



"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import WeightEditor, { type DraftAsset } from "@/components/WeightEditor";
import Avatar from "@/components/Avatar";
import { CompanyLogo } from "@/components/TickerChip";

const TINTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function tintFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-strong">
      {n}
    </span>
  );
}

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
      router.push(`/basket/${data.index.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish index");
      setPublishing(false);
    }
  }

  const pillTickers = assets.slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Editorial header */}
      <div className="max-w-2xl animate-fade-up">
        <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-foreground">
          Build your basket.
          <br />
          Publish it in minutes.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          No upfront capital needed. Choose your holdings, set the weights, and share it with the
          community.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-5">
          <div
            className="animate-fade-up rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 space-y-5"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex items-center gap-2.5">
              <StepNumber n={1} />
              <h2 className="font-display text-xl font-medium text-foreground">Basket details</h2>
            </div>

            <div>
              <label className="text-sm font-medium uppercase tracking-wider text-muted">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Next-Gen Robotics, Nuclear Renaissance, Cloud Titans"
                className="mt-1.5 w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-base font-medium outline-none transition-colors placeholder:text-muted/70"
              />
            </div>

            <div>
              <label className="text-sm font-medium uppercase tracking-wider text-muted">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why this combination of companies, why now..."
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-base leading-relaxed outline-none transition-colors placeholder:text-muted/70"
              />
            </div>
          </div>

          <div
            className="animate-fade-up rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center gap-2.5">
              <StepNumber n={2} />
              <h2 className="font-display text-xl font-medium text-foreground">Holdings</h2>
            </div>
            <p className="mt-1 mb-4 pl-[34px] text-base text-muted">
              Select equities and allocate weights summing to 100%.
            </p>
            <WeightEditor assets={assets} onChange={setAssets} />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "450ms" }}>
            <button
              onClick={handlePublish}
              disabled={publishing || (signedIn && !canPublish)}
              className="w-full rounded-xl bg-accent py-3.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100"
            >
              {publishing
                ? "Publishing..."
                : signedIn
                ? canPublish
                  ? "Publish basket"
                  : `Complete requirements (${total === 100 ? "enter name" : `needs ${100 - total}% allocation`})`
                : "Sign in to publish"}
            </button>
            {error && <p className="mt-2 text-base text-negative">{error}</p>}
          </div>
        </div>

        {/* Right column: live preview, matching the real basket card */}
        <div className="animate-fade-up lg:sticky lg:top-24 lg:self-start" style={{ animationDelay: "220ms" }}>
          <span className="text-sm font-medium uppercase tracking-wider text-muted">Preview</span>

          <div className="mt-3 flex flex-col rounded-2xl border border-border-subtle bg-surface p-5">
            <div
              className="relative flex flex-wrap items-center gap-2 rounded-xl p-4"
              style={{ backgroundColor: `color-mix(in srgb, ${tintFor(name || "draft")} 14%, var(--surface-hover))` }}
            >
              {assets.length === 0 ? (
                <span className="text-base text-muted">Search and add equities</span>
              ) : (
                assets.slice(0, 4).map((a) => <CompanyLogo key={a.symbol} symbol={a.symbol} size={34} />)
              )}
              {assets.length > 4 && <span className="font-mono text-sm text-muted">+{assets.length - 4}</span>}

              <span className="absolute right-3 top-3 rounded-lg bg-surface px-2 py-1 text-sm font-semibold text-muted">
                Draft
              </span>
            </div>

            <h3 className="font-display mt-4 text-2xl font-medium leading-tight tracking-tight text-foreground">
              {name.trim() || "Untitled basket"}
            </h3>
            <div className="mt-1.5 flex items-center gap-1.5 text-base text-muted">
              <Avatar username={username || "curator"} size={16} styleIndex={avatarIndex} />
              <span>@{username || "curator"}</span>
            </div>

            <p className="mt-2 text-base leading-relaxed text-muted line-clamp-1">
              {description.trim() || "Your description will appear here."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {pillTickers.map((a) => (
                <span key={a.symbol} className="rounded-lg bg-surface-hover px-2.5 py-1 font-mono text-sm font-medium text-foreground">
                  {a.symbol}
                </span>
              ))}
              <span
                className={`rounded-lg px-2.5 py-1 text-sm font-medium ${
                  total === 100 ? "bg-positive-soft text-positive" : "bg-surface-hover text-muted"
                }`}
              >
                {total}% allocated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { profiles, getIndexesByCreator } from "@/lib/mock-data";
import IndexCard from "@/components/IndexCard";
import { useMockSession } from "@/lib/mock-session";

export default function CreatorIndexesPage() {
  const { username: routeUsername } = useParams<{ username: string }>();
  const session = useMockSession();
  const isOwnProfile = session.signedIn && session.username === routeUsername;

  const seedProfile = profiles[routeUsername];
  if (!seedProfile && !isOwnProfile) notFound();

  const created = getIndexesByCreator(routeUsername);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={`/u/${routeUsername}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
      >
        <span aria-hidden>←</span> Back to @{routeUsername}
      </Link>

      <div className="mt-4 flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {isOwnProfile ? "Your Published Indexes" : `Indexes curated by @${routeUsername}`}
        </h1>
        <p className="text-sm text-muted">
          {created.length} active thematic {created.length === 1 ? "strategy" : "strategies"} deployed on Solana.
        </p>
      </div>

      {created.length === 0 ? (
        <div className="elevated mt-8 flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-8">
          <p className="text-sm text-muted">
            {isOwnProfile ? "You haven't published an index yet." : "No indexes published yet."}
          </p>
          {isOwnProfile && (
            <Link
              href="/create"
              className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent-strong active:scale-95"
            >
              Create an index
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {created.map((index) => (
            <IndexCard key={index.id} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import type { PublicIndex } from "@/lib/db/index-stats";
import IndexCard from "@/components/IndexCard";
import { useSession } from "@/lib/session";

export default function CreatorIndexesPage() {
  const { username: routeUsername } = useParams<{ username: string }>();
  const session = useSession();
  const isOwnProfile = session.signedIn && session.username === routeUsername;

  const [created, setCreated] = useState<PublicIndex[] | null>(null);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOwnProfile) {
      fetch(`/api/users/${routeUsername}`).then((res) => setUserExists(res.ok));
    }
    fetch(`/api/indexes/by-creator/${routeUsername}`)
      .then((res) => res.json())
      .then((data) => setCreated(data.indexes ?? []));
  }, [routeUsername, isOwnProfile]);

  if (userExists === false && !isOwnProfile) notFound();
  if (created === null) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {isOwnProfile ? "Your Published Indexes" : `Indexes curated by @${routeUsername}`}
        </h1>
        <p className="text-sm text-muted">
          {created.length} published {created.length === 1 ? "index" : "indexes"} on Solana.
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicIndex } from "@/lib/db/index-stats";
import IndexCard from "@/components/IndexCard";

function EmptyBasketSlot() {
  return (
    <Link
      href="/create"
      className="col-span-full flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle p-6 text-center transition-colors hover:border-accent/50"
    >
      <span className="font-display text-xl text-foreground">Be the first basket</span>
      <span className="mt-1.5 text-sm text-muted">
        Nobody has published one yet. Build the first, it takes minutes.
      </span>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground">
        Create a basket
      </span>
    </Link>
  );
}

export default function LandingPage() {
  const [indexes, setIndexes] = useState<PublicIndex[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/indexes")
      .then((res) => res.json())
      .then((data) => setIndexes((data.indexes ?? []).slice(0, 3)))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-display text-2xl italic text-foreground">Basket</span>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent-strong"
        >
          Open app
        </Link>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <h1 className="max-w-3xl font-display text-[clamp(2.75rem,6.5vw,5rem)] font-medium leading-[1.03] tracking-tight text-foreground">
          Create a basket.
          <br />
          Invest in any basket.
        </h1>
        <p className="mt-6 max-w-[58ch] text-base leading-relaxed text-muted sm:text-lg">
          <span className="text-foreground">
            A community-curated marketplace for stock baskets built from tokenized equities on
            Solana.
          </span>{" "}
          Build your own index like the S&amp;P 500, publish it, and let others invest in the
          whole basket through a single transaction.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent-strong"
          >
            Create a basket
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/30"
          >
            Explore baskets
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {!loaded
            ? null
            : indexes.length > 0
              ? indexes.map((index) => <IndexCard key={index.id} index={index} />)
              : <EmptyBasketSlot />}
        </div>
      </section>
    </div>
  );
}

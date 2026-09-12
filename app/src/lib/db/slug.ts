import { db } from "./client";
import { indexes } from "./schema";
import { eq } from "drizzle-orm";

function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return cleaned || "index";
}

/** Finds a free index slug derived from its name, appending a short suffix on collision. */
export async function generateUniqueIndexSlug(name: string): Promise<string> {
  const base = slugify(name);

  const existing = await db.select({ id: indexes.id }).from(indexes).where(eq(indexes.id, base));
  if (existing.length === 0) return base;

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rows = await db.select({ id: indexes.id }).from(indexes).where(eq(indexes.id, candidate));
    if (rows.length === 0) return candidate;
  }
  return `${base}-${Date.now()}`;
}

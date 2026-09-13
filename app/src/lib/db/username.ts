import { db } from "./client";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const USERNAME_PATTERN = /^[a-z0-9]{3,20}$/;

function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  return cleaned || "user";
}

/** Same character rule auto-generated usernames follow: lowercase a-z0-9, 3-20 chars. Keeps every
 * username safe to use verbatim as a `/u/[username]` route segment. */
export function isValidUsername(input: string): boolean {
  return USERNAME_PATTERN.test(input);
}

/** Finds a free username derived from a hint (usually the email prefix), appending a short suffix on collision. */
export async function generateUniqueUsername(hint: string): Promise<string> {
  const base = slugify(hint);

  const existing = await db.select({ username: users.username }).from(users).where(eq(users.username, base));
  if (existing.length === 0) return base;

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const rows = await db.select({ username: users.username }).from(users).where(eq(users.username, candidate));
    if (rows.length === 0) return candidate;
  }
  // astronomically unlikely fallback
  return `${base}${Date.now()}`;
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { generateUniqueUsername } from "@/lib/db/username";

/**
 * Called by the client right after a successful Privy login. Upserts the
 * corresponding row in our own `users` table (identity only — never wallet
 * funds or balances, which stay onchain).
 *
 * NOTE: trusts the client-supplied `privyUserId` as-is. Verifying it against
 * Privy's server SDK requires the app's Privy *secret* (not the public app
 * id we have), which we don't hold yet — a known gap, fine for a hackathon
 * demo, not for production.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const privyUserId: string | undefined = body?.privyUserId;
  const email: string | undefined = body?.email;
  const loginMethod: string | undefined = body?.loginMethod;

  if (!privyUserId) {
    return NextResponse.json({ error: "privyUserId is required" }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.id, privyUserId));
  if (existing.length > 0) {
    return NextResponse.json({ user: existing[0] });
  }

  const username = await generateUniqueUsername(email?.split("@")[0] ?? "user");

  const [created] = await db
    .insert(users)
    .values({ id: privyUserId, username, email, loginMethod })
    .returning();

  return NextResponse.json({ user: created }, { status: 201 });
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * NOTE: same trust caveat as /api/users/sync — trusts the client-supplied
 * privyUserId rather than verifying a Privy access token server-side (we
 * only hold the public app id, not the app secret needed to verify).
 */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const privyUserId: string | undefined = body?.privyUserId;
  if (!privyUserId) {
    return NextResponse.json({ error: "privyUserId is required" }, { status: 400 });
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (typeof body.avatarIndex === "number") patch.avatarIndex = body.avatarIndex;
  if (typeof body.username === "string") patch.username = body.username;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const [updated] = await db.update(users).set(patch).where(eq(users.id, privyUserId)).returning();
  if (!updated) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }
  return NextResponse.json({ user: updated });
}

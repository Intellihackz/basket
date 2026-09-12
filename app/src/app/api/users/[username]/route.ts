import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/** Public profile lookup — never returns email or other private fields. */
export async function GET(_request: Request, props: { params: Promise<{ username: string }> }) {
  const { username } = await props.params;
  const [user] = await db
    .select({ id: users.id, username: users.username, avatarIndex: users.avatarIndex, walletPubkey: users.walletPubkey })
    .from(users)
    .where(eq(users.username, username));

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      username: user.username,
      avatarIndex: user.avatarIndex,
      walletLinked: Boolean(user.walletPubkey),
      walletShort: user.walletPubkey ? `${user.walletPubkey.slice(0, 4)}...${user.walletPubkey.slice(-4)}` : null,
    },
  });
}

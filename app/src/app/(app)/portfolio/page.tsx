"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

/** Portfolio now lives on the profile page. This route just forwards old links there. */
export default function PortfolioRedirect() {
  const { signedIn, username } = useSession();
  const router = useRouter();

  useEffect(() => {
    router.replace(signedIn && username ? `/u/${username}` : "/explore");
  }, [signedIn, username, router]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockSession } from "@/lib/mock-session";

/** Portfolio now lives on the profile page. This route just forwards old links there. */
export default function PortfolioRedirect() {
  const { signedIn, username } = useMockSession();
  const router = useRouter();

  useEffect(() => {
    router.replace(signedIn && username ? `/u/${username}` : "/explore");
  }, [signedIn, username, router]);

  return null;
}

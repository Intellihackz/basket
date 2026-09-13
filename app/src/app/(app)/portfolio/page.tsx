"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Portfolio now lives on the baskets page. This route just forwards old links there. */
export default function PortfolioRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/baskets");
  }, [router]);

  return null;
}

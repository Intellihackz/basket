"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Basket detail pages now live at /basket/[id]. This route just forwards old links there. */
export default function IndexDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/basket/${id}`);
  }, [id, router]);

  return null;
}

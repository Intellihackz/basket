"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type BottomNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

export default function BottomNav({ items }: { items: BottomNavItem[] }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
      <div className="flex items-center justify-around rounded-2xl border border-border-subtle bg-surface/95 py-2 shadow-[0_8px_24px_rgb(var(--shadow-color)/0.16)] backdrop-blur-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 py-1"
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                item.active ? "bg-accent-soft" : ""
              )}
            >
              <item.icon className={cn("h-5 w-5", item.active ? "text-accent-strong" : "text-muted")} />
            </span>
            <span className={cn("text-[11px] font-medium", item.active ? "text-accent-strong" : "text-muted")}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

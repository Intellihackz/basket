"use client";

import { useState } from "react";
import Image from "next/image";
import { findXStock } from "@/lib/xstocks/registry";

export function CompanyLogo({
  symbol,
  size = 20,
  className = "",
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const xstock = findXStock(symbol);

  const logo = !imgError ? xstock?.logo : null;
  const name = xstock?.name || symbol;

  const radius = Math.round(size * 0.22);

  if (logo) {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-border-subtle bg-white shadow-2xs ${className}`}
        style={{ width: size, height: size, borderRadius: radius }}
        title={name}
      >
        <Image
          src={logo}
          alt={symbol}
          width={size * 2}
          height={size * 2}
          unoptimized
          onError={() => setImgError(true)}
          className="h-full w-full object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center border border-border-subtle bg-surface-hover font-mono font-bold text-foreground shadow-2xs ${className}`}
      style={{ width: size, height: size, borderRadius: radius, fontSize: Math.max(9, Math.round(size * 0.32)) }}
      title={name}
    >
      {symbol.replace(/x$/i, "").slice(0, 2)}
    </div>
  );
}

export default function TickerChip({
  symbol,
  pct,
  positive = true,
  rotate = 0,
  className = "",
}: {
  symbol: string;
  pct?: string;
  positive?: boolean;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      className={`elevated inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
    >
      <CompanyLogo symbol={symbol} size={18} />
      <span className="font-mono text-sm font-bold text-foreground">{symbol}</span>
      {pct && (
        <span
          className={`font-mono text-xs font-semibold tabular-nums ${
            positive ? "text-positive" : "text-negative"
          }`}
        >
          {pct}
        </span>
      )}
    </div>
  );
}


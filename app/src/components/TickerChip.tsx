import Image from "next/image";
import { ASSET_METADATA } from "@/lib/mock-data";

export function CompanyLogo({
  symbol,
  size = 20,
  className = "",
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const meta = ASSET_METADATA[symbol];

  if (meta?.logo) {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-white shadow-2xs ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={meta.logo}
          alt={symbol}
          width={size * 2}
          height={size * 2}
          unoptimized
          className="h-full w-full object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-hover font-mono text-[10px] font-bold text-foreground shadow-2xs ${className}`}
      style={{ width: size, height: size }}
      title={meta?.name || symbol}
    >
      {symbol.slice(0, 2)}
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
      <span className="font-mono text-xs font-bold text-foreground">{symbol}</span>
      {pct && (
        <span
          className={`font-mono text-[11px] font-semibold tabular-nums ${
            positive ? "text-positive" : "text-negative"
          }`}
        >
          {pct}
        </span>
      )}
    </div>
  );
}


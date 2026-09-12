import type { PricePoint } from "@/lib/mock-data";

export default function Sparkline({
  points,
  positive,
  height = 40,
  fill = false,
  uid,
}: {
  points: PricePoint[];
  positive: boolean;
  height?: number;
  /** render as a bled, low-contrast background layer rather than a boxed chart */
  fill?: boolean;
  uid?: string;
}) {
  const width = 200;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p.value - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M${coords.join(" L")}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const color = positive ? "var(--positive)" : "var(--negative)";
  const gradientId = `spark-${positive ? "up" : "down"}-${uid ?? "solo"}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fill ? 0.14 : 0.25} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={fill ? 1.25 : 1.5}
        strokeOpacity={fill ? 0.55 : 1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function formatReturn(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export default function BasketReturnChart({
  publishedAt,
  returnSincePublishPct,
}: {
  publishedAt: string;
  returnSincePublishPct: number | null;
}) {
  if (returnSincePublishPct === null) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border-subtle text-sm text-muted">
        Not enough live price data yet
      </div>
    );
  }

  const pct = returnSincePublishPct;
  const positive = pct >= 0;
  const width = 400;
  const height = 120;
  const padX = 4;
  const midY = height / 2;
  const halfHeight = 36;

  // A per-chart reference scale so even a tiny move renders a visible, honestly
  // proportioned slope instead of a perfectly flat line — never clips real data,
  // since these two points always define the scale they're drawn against.
  const ampRef = Math.max(Math.abs(pct), 1);
  const endY = midY - (pct / ampRef) * halfHeight;

  const startX = padX;
  const endX = width - padX;

  const lineColor = positive ? "var(--positive)" : "var(--negative)";
  const areaPath = `M${startX},${midY} L${endX},${endY} L${endX},${height} L${startX},${height} Z`;
  const linePath = `M${startX},${midY} L${endX},${endY}`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <line x1={startX} y1={midY} x2={endX} y2={midY} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
        <path d={areaPath} fill={lineColor} opacity="0.08" />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" />
        <circle cx={startX} cy={midY} r="3" fill={lineColor} />
        <circle cx={endX} cy={endY} r="3.5" fill={lineColor} />
      </svg>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
        <span>Published {new Date(publishedAt).toLocaleDateString()}</span>
        <span className={`font-mono font-semibold ${positive ? "text-positive" : "text-negative"}`}>
          {formatReturn(pct)} now
        </span>
      </div>
    </div>
  );
}

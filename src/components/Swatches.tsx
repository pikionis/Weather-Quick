/** A legend mark that matches a chart line. */
export function LineSwatch({ color, thin = false }: { color: string; thin?: boolean }) {
  return (
    <svg width="18" height="6" aria-hidden="true">
      <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth={thin ? 1.25 : 2} />
    </svg>
  )
}

/** Keeps the space while a chart's code loads, so the page does not jump. */
export function ChartFallback({ height }: { height: number }) {
  return (
    <div className="chart-fallback" style={{ height }}>
      Drawing…
    </div>
  )
}

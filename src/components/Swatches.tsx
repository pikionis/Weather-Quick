/** Legend marks that match the chart lines and bars. */
export function LineSwatch({ color, dashed = false }: { color: string; dashed?: boolean }) {
  return (
    <svg width="22" height="6" aria-hidden="true">
      <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth={dashed ? 2 : 2.5} strokeDasharray={dashed ? '6 5' : undefined} />
    </svg>
  )
}

export function BarSwatch({ color }: { color: string }) {
  return <span className="bar-swatch" style={{ background: color }} aria-hidden="true" />
}

/** Keeps the space while a chart's code loads, so the page does not jump. */
export function ChartFallback({ height }: { height: number }) {
  return (
    <div className="chart-fallback" style={{ height }}>
      Loading chart…
    </div>
  )
}

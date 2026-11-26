/**
 * The plot area inside every chart: the y-axis gutter on the left and a margin on the right, in px.
 * The trace, the day columns and the pointer maths all use these, so they line up to the pixel.
 */
export const PLOT = { left: 44, right: 12 }

/** Where a pointer sits across the plot area, from 0 (left edge) to 1 (right edge). */
export function plotFraction(clientX: number, box: DOMRect): number {
  return (clientX - box.left - PLOT.left) / (box.width - PLOT.left - PLOT.right)
}

export const axisTick = { fill: 'var(--muted)', fontSize: 11 }

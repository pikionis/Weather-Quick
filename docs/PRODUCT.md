# Product

## Register

product

## Users

Two readers use the same page, as often on a phone as on a laptop.

- A visitor planning the next days on Kos checks it once or twice a day, sometimes on a phone outdoors in bright light.
- A reviewer opens it on a laptop, often on a shared screen in a video call, to judge the decisions behind it.

Both want four answers: what the weather is now, how the last weeks went, what is coming, and how far to trust it.

## Product Purpose

Weather Quick shows Kos now, the past 4 weeks and the next 7 days from Open-Meteo. It adds a second opinion: our bias-corrected forecast next to the source, with the gap and our confidence from a backtest. Success: a visitor gets the answer at a glance, and sees plainly when the source beats our correction.

## Brand Personality

Precise, calm, honest, and visibly live. A dashboard with a menu, where every box has its own options (layers, max or min, a measure). One moment of wow, the live scene over Kos: the wind, rain and temperature of the hour, moving. The precision instrument stays as a second dashboard. Everything else stays quiet and familiar.

## Anti-references

- A typical weather app: sky-blue gradients, cartoon sun and cloud icons, a giant temperature in the middle of the screen.
- A dark developer tool: black background, cyan or purple glow, terminal fonts everywhere.
- Motion that is not data: animations and effects that delay reading the numbers. On the live scene, motion carries the wind and the rain; nowhere else.

## Design Principles

1. **The numbers lead.** Every value is readable first, styled second, and carries its unit.
2. **The live scene first, the numbers right under it.** What moves on the scene comes from the data of that hour; the boxes below give the exact values.
3. **Show the calibration.** Say where the data comes from, which grid cell, how fresh it is, and when the source wins.
4. **Live, not busy.** Show that the page is reading (clock, next update, state); motion only for changes of state.
5. **Small enough to change live.** The code stays readable for a change during the review call.

## Accessibility & Inclusion

WCAG 2.2 AA. Respect `prefers-reduced-motion`. Colour never carries meaning alone: series are labelled and palettes pass the colour-blind check. The keyboard can move the time cursor. Works from 390 px wide to a laptop.

# UI design

Status: dashboard v2, from Petros's mockup of 2026-11-26 (https://claude.ai/artifact/N3Z5jX8NQbgzbdG6W6LYxz, private to the owner), with the live scene and the instrument added at his request. It replaces the card mockup and the instrument page, which had no menu and no options per box. Copy is in English.

## Layout

| Region | Laptop (900 px and up) | Phone |
| --- | --- | --- |
| Menu | Dark column on the left, 260 px; folds to a 64 px rail | A drawer from the left, opened by "Menu"; Esc or the backdrop closes it |
| Header | "Kos town · Wednesday 25 November, 22:45 local", the dashboard's title, and the status: Live, the Kos clock, "updated · next in m:ss" | Same, stacked |
| Boxes | White cards, 12 px radius, 20 px gaps; some rows hold two boxes (2:1) | One column |

## The menu

- **Place:** Kos town, South Aegean, Greece, coordinates and time zone.
- **Dashboards:** Overview and Instrument. The choice is in the URL (`?dashboard=instrument`).
- **Views:** links to the boxes of the current dashboard; the box in view is marked.
- **Layers:** temperature, dew point, wind, gusts, rain. They choose what the live scene and the charts draw. Defaults as in the mockup: dew point and gusts off.
- **Second opinion:** Source, Corrected and 80% band. Disabled, with a note, until the backtest (steps 5 and 6).

## Overview, box by box

1. **Live over Kos** (the main box, added to the mockup):
   - The coastline around Kos on a tilted plane, with wind particles that move as fast as the wind and where it blows.
   - Rain that falls as hard as that hour's mm/h: light up to 2.5, moderate up to 7.6, heavy above.
   - Land tinted by the air temperature.
   - A timeline from the past 28 days to the next 7, with Play and Now.
   - Under it, Wind, Rain or Temperature day by day, past and forecast. Clicking a day moves the scene to its noon.
2. **Right now:**
   - Now: temperature, sky, feels like, and a min-to-max bar for today.
   - Wind: speed, 16-point direction, gusts, and a vane whose streaks run with the wind.
   - Dew point, and Rain (mm, plus the highest chance in the next 48 hours).
   - Second opinion tile: placeholder until step 6.
3. **Next 48 hours:** hourly charts by layer (temperature and dew point, wind and gusts, rain chance) on one time axis, with synced tooltips. **Track record** beside it: placeholder until step 6.
4. **Next 7 days:** Max/Min switch; the source's chart and a table (Day, Sky, Source, Ours, 80% range, Gap, Rain, Wind). The Ours, 80% range and Gap columns show "—" until step 6.
5. **Past 28 days:** max and min, rain per day, wind and gusts, by layer, on one date axis. **28 days in numbers** beside it: warmest day, coolest night, wettest day, total rain with days of 1 mm or more, strongest gust.
6. **About the data:** sources (with the live grid cell), method, limits.

The **Instrument** dashboard keeps the instrument: the reading, the hourly trace with a time cursor, day columns, and the past 4 weeks as range bars.

## Colours

| Token | Value | Use |
| --- | --- | --- |
| bg / card / border | `#F3F5F7` / `#FFFFFF` / `#DCE2E8` | page, boxes |
| ink / muted | `#14202B` / `#4A5663` | text |
| menu | `#14202B`, `#1D2C3A`, `#2A3E51`; text `#EEF2F6`, `#AEBBC8` | the dark menu |
| temperature / minimum | `#B4501A` / `#2E6DB4` | lines |
| dew point / wind | `#6A4C9C` / `#1B7A72` | lines; gusts dashed |
| rain | `#5F8DB8` | bars (the mockup's `#7FA6CC` is 2.6:1 on white; this is 3.5:1) |
| source | `#5C6670` | the source line |
| live | `#2E8B57` | the Live light |

Pairs that share a chart pass the `dataviz` validator: temperature and dew point (ΔE 22.6), maximum and minimum (ΔE 26.6). Fonts: the system's.

## Not decided here

- The look of the second opinion (step 6): the corrected line's colour must stand apart from the source and pass the validator.
- More variables (cloud cover, pressure, humidity, waves) and a wider map need new data; see `NOTES.md`.

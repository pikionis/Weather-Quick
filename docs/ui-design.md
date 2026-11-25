# UI design

Status: approved by Petros on 2026-11-26 as good enough to build. Mockup: https://claude.ai/artifact/RTfTBPYEAEwehKEqQ8jzdq (desktop and mobile; private to the owner).

The ASCII wireframes in [architecture.md](architecture.md#5-wireframes) give the layout. This file gives the details steps 4 and 6 build from. Copy is in English.

## Layout

| Region | Desktop (≥ 900 px) | Mobile |
| --- | --- | --- |
| Header | Title, "Kos, South Aegean, Greece · 36.89° N, 27.29° E" on the left; "Updated HH:MM local · refreshes every 10 min" on the right | Same, stacked |
| Now | Left card, max 380 px wide | First card, full width |
| Badge | Bottom of the Now card | Same |
| Next 7 days | Right card, takes the rest | Second card |
| Past 4 weeks | Full-width card below | Third card |
| Footer | Credit left, "Times in Europe/Athens" right | Stacked |

Container max width 1200 px, padding 32 px 40 px on desktop, 16 px on mobile, 20 px gap between cards. The two top cards sit in a wrapping flex row, so they stack without a media query.

## Content per region

- **Now:** temperature (64 px), "Clear sky · feels like X °C" (WMO code to text), then a 2×2 grid: wind (km/h and compass), gusts, dew point, precipitation.
- **Badge:** title "Second opinion · last 21 days". One line per variable. The pill is "Ours" (filled blue) when the correction wins and "Source" (outlined) when it doesn't. Text: "Max temp: our correction was 0.8 °C closer to the truth (MAE 1.1 vs 1.9 °C, 18 days)." / "Min temp: the source wins (MAE 1.0 vs 1.1 °C), so we show it unchanged." If the second opinion failed: "Second opinion unavailable: <reason>".
- **Next 7 days:**
  - Three toggle buttons, Source, Corrected and 80% band, all on by default, with `aria-pressed`.
  - Chart: daily max and min. Corrected is solid blue at 3 px with dots on the max. Source is dashed grey at 2 px. The band is blue at 14% opacity.
  - Legend under the chart: "80% band: 8 in 10 past errors fell inside".
  - Table columns: Day, Sky, Source max, Ours max, 80% range, Gap, Min, Rain. It scrolls sideways under 520 px.
- **Past 4 weeks:** max line (orange), min line (blue), rain bars (light blue, scaled to 45% of the chart height). One summary line: wettest and warmest day.
- **Footer:** "Weather data by Open-Meteo.com" (link) · "licensed CC BY 4.0" (link) · "truth for the backtest: ERA5 via Open-Meteo".

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| bg | `#F3F5F7` | page |
| surface | `#FFFFFF`, border `#DCE2E8`, radius 12 px | cards |
| ink | `#14202B` | text |
| muted | `#4A5663` | labels, axes (passes 4.5:1 on white) |
| corrected | `#1F5FA0` | our series, links, Ours pill |
| source | `#5C6670`, dash `6 5` | source series |
| max | `#B4501A` | past max line |
| rain | `#9DB8D3` | rain bars |
| badge | bg `#EAF1F8`, border `#C5D7EA` | second-opinion box |
| fonts | Space Grotesk 500/600 for title and big numbers, Inter 400/500/600 for the rest | |

Buttons are at least 44 px tall. Selected: ink background with white text. Off: white background with a `#8C97A3` border.

## Not decided here

- Rain bars and fonts: open in architecture.md section 6. The chart library is decided there (Recharts 3.10.1). The mockup draws plain SVG only to show the look.
- The numbers in the mockup's corrected series, band and badge are illustrative until step 5.

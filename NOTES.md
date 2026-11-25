# Notes

Working notes for the reviewers: what we chose, what we assumed and why. Written as we go.

## What we chose

- **Place:** Kos town, Greece (36.893 N, 27.288 E, Europe/Athens). Open-Meteo snaps it to the grid cell at 36.875 N, 27.324 E, elevation 11 m: a coastal cell, about 3 km east of town.
- **Base:** weather now, the past 28 days and the next 7 days, from one Forecast API call (`past_days=28`, `forecast_days=7`, `timezone=auto`). Current conditions and the forecast refresh every 10 minutes; history and the backtest load once per page load.
- **Extension:** the *second opinion*. Our corrected forecast next to the source, with the gap and our confidence. See `docs/adr/0002-bias-correction.md`.
- **Stack:** Vite + React + TypeScript, static site on Vercel, no backend. Open-Meteo is keyless, so no key exists to leak. See `docs/adr/0001-static-vite-no-backend.md`.

## Assumptions

- "Past weeks" means 28 days and "coming days" means 7. Both are a single parameter.
- Daily values are computed in local time (Europe/Athens). The response uses one fixed `utc_offset_seconds` for the whole range, so hours around a daylight-saving change need a check.
- **Two sources for the past, on purpose.** The base shows `past_days` from the Forecast API: one call, no gap in recent days, but model data. The backtest uses ERA5 (Historical Weather API) as "what actually happened": the same truth for every day, but it lags by a few days, so the most recent days stay out of the backtest. ERA5 is a reanalysis, not a station reading.
- Units stay at the API defaults (°C, km/h, mm) and every value in the UI shows its unit.
- The place comes from the Geocoding API. A search for "Kos" without a country returns Kūstī (Sudan) and Košice (Slovakia) first; with `countryCode=GR` the first result is Kos town (36.893 N, 27.288 E, population 19,244). Default: Kos town.

## Proposals rejected

- **Next.js with a server route in front of Open-Meteo** (proposed by the AI in planning). Chosen instead: a static Vite site with no backend. Why: nothing to run or secure, fewer moving parts in 6 hours. Cost: no shared cache, and score-change notifications will need a serverless function later.
- **Runner score (the "verdict")** as the extension. Chosen instead: the second opinion. It moves to the roadmap.

## Rough edges

- On 2026-11-25 the Previous Runs and ERA5 (archive) APIs answered "Daily API request limit exceeded" from the shared cloud IP on 2026-11-25. Visitors call from their own IPs, but a busy shared network (office, VPN) could hit the same limit. The page must then show the source alone and say why.

## Data licence

Open-Meteo data is CC BY 4.0. The footer says "Weather data by Open-Meteo.com" with a link. Free use is non-commercial and under 10,000 calls a day, 5,000 an hour and 600 a minute.

## Roadmap

To be written at the end, in order, with what each step needs. Current order:

1. Runner score (the "verdict") per day, with the best two-hour window.
2. Alerts when the score of a planned day changes. Needs a serverless function, a cron and storage.

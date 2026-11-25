# Notes

Working notes for the reviewers: what we chose, what we assumed and why. Written as we go.

## What we chose

- **Place:** Kos town, Greece (36.893 N, 27.288 E, Europe/Athens). Open-Meteo snaps it to the grid cell at 36.875 N, 27.324 E, elevation 11 m: a coastal cell, about 3 km east of town. Kos is the fixed default. If search makes it in, every result shows country and region (`country`, `admin1`) so that Kos is not confused with other places called "Kos".
- **Base:** weather now, the past 28 days and the next 7 days, from one Forecast API call (`past_days=28`, `forecast_days=7`, `timezone=auto`). Current conditions and the forecast refresh every 10 minutes; history and the backtest load once per page load.
- **Extension:** the *second opinion*. Our corrected forecast next to the source, with the gap and our confidence. See `docs/adr/0002-bias-correction.md`.
- **Stack:** Vite + React + TypeScript, static site on Vercel, no backend. Open-Meteo is keyless, so no key exists to leak. See `docs/adr/0001-static-vite-no-backend.md`.

## How we work

- **One window, one step at a time.** I started with two parallel windows and moved to one, because only steps 4 and 5 could run in parallel. The two windows (worktrees, double setup, coordination) cost more time than they saved. With one agent and one step per PR, in order, it is easier for me to follow and check the work.

## Assumptions

- "Past weeks" means 28 days and "coming days" means 7. Both are a single parameter.
- Daily values are computed in local time (Europe/Athens). The response uses one fixed `utc_offset_seconds` for the whole range, so hours around a daylight-saving change need a check.
- **Two sources for the past, on purpose.** The base shows `past_days` from the Forecast API: one call, no gap in recent days, but model data. The backtest uses ERA5 (Historical Weather API) as "what actually happened": the same truth for every day, but it lags by a few days, so the most recent days stay out of the backtest. ERA5 is a reanalysis, not a station reading.
- Units stay at the API defaults (°C, km/h, mm) and every value in the UI shows its unit.
- The place comes from the Geocoding API. A search for "Kos" without a country returns Kūstī (Sudan) and Košice (Slovakia) first; with `countryCode=GR` the first result is Kos town (36.893 N, 27.288 E, population 19,244). Default: Kos town.

## Proposals rejected

- **Next.js with a server route in front of Open-Meteo** (proposed by the AI in planning). Chosen instead: a static Vite site with no backend. Why: nothing to run or secure, fewer moving parts in 6 hours. Cost: no shared cache, and score-change notifications will need a serverless function later.
- **Runner score (the "verdict")** as the extension. Chosen instead: the second opinion. It moves to the roadmap.
- **Laravel with an AI SDK**, after a 2020 Laravel News article on `vemcogroup/laravel-weather`. Chosen instead: stay on the static Vite site. Why: that package wraps Dark Sky and weatherstack, which are keyed providers, and Dark Sky no longer accepts sign-ups. Open-Meteo needs no backend. A PHP host plus an LLM key would cost 2 to 3 of the remaining ~4:50 hours. An AI-written explanation could come later as a serverless function.
- **Dropping `hourly` from the base Forecast call** (proposed by the AI before step 4: 44 KB to 2.6 KB, request weight 5.5 to 3.75). Chosen instead: keep it. Why: the contract is already merged, and the change would touch the brief, the type, the fixture and the tests for no visible gain. If nothing uses `hourly` after step 6, it goes then.

## What real responses taught us (2026-11-25)

- **Three grid cells, not one.** Forecast (default model): 36.875 N, 27.324 E. ERA5: 36.872 N, 27.237 E, about 8 km west. Multi-model call (`models=ecmwf_ifs025,gfs_seamless,icon_seamless`): 37.0 N, 27.5 E, a coarse cell partly over sea. Part of any "bias" is this location gap; the correction absorbs it, which is what we want for Kos town.
- **Multi-model names:** each variable gets the model id as a suffix, e.g. `temperature_2m_max_ecmwf_ifs025`. An unknown model id returns HTTP 400 with a `reason`.
- **Daylight saving:** the ERA5 sample (29 May to 24 Nov) has one fixed `utc_offset_seconds` (+2 h) and no missing or repeated hour on 25 October. Before that date, its hours are one hour off local summer time. The backtest window (last weeks) is after the change, so it is not affected now.
- **Previous Runs `_previous_day7`** jumps at midnight (e.g. 17.6 to 18.8 °C): each day comes from a different run. Aggregate per local day, never across midnight.
- **Fixtures** live in `src/lib/fixtures/`. The Previous Runs one has lead days 1, 3 and 7 for 15 days; the live call will ask for 1 to 7.

## What real responses taught us (2026-11-26)

- **Requests have a weight.** The `X-RateLimit-Cost` header counts days and variables: the full Forecast request is 5.5 calls, a 7-day refresh 2.2. So the refresh leaves the history out.
- **The archive default is not ERA5.** Without `models`, 336 of 336 hours (12 to 25 November) equal `ecmwf_ifs`, on its cell (36.872 N, 27.237 E), with no gap up to yesterday. With `models=era5` the cell is 37.0 N, 27.25 E, the last full day was 19 November, and the hours differ by 0.68 °C on average. `kos-era5.json` has the `ecmwf_ifs` cell, so the "ERA5" cell in the list above is really the default's. Open: `docs/architecture.md` section 6, before step 5.
- **About 35 days of history cannot feed the backtest.** With a 21-day bias window and the real ERA5 lag they leave 1 backtest day at lead 1 and none after it, under our own n ≥ 10 rule. 90 days leave 50 to 56. Open: same place.

## Dependencies

- Vite + React + TypeScript from the official `react-ts` template (it lints with oxlint).
- `vitest` added as the test runner: the unit-test rule needs one, and it is Vite's own.
- **Recharts 3.10.1**, exact version, approved on 2026-11-26 as the one chart library. It is installed in the step 4 PR, not before. Why: JSX that is easy to change live in the review call, SVG, and a ready range area for the step 6 band. Cost: it is the heaviest of the four measured (gzip over React: Recharts 137 KB, Observable Plot 95 KB, Chart.js 65 KB, uPlot 23 KB; Recharts measured on 3.11.1), so it loads lazily. 3.10.1 because 3.11.1 was three days old.
- **Lockfile rule for that install:** it may only add Recharts and its dependencies. On Windows, `npm install` had removed the `@emnapi` entries in two old worktrees, which could break `npm ci` elsewhere. If anything else disappears, we stop before committing.

## Rough edges

- On 2026-11-25 the Previous Runs and ERA5 (archive) APIs answered "Daily API request limit exceeded" from the shared cloud IP on 2026-11-25. Visitors call from their own IPs, but a busy shared network (office, VPN) could hit the same limit. The page must then show the source alone and say why.

## Data licence

Open-Meteo data is CC BY 4.0. The footer says "Weather data by Open-Meteo.com" with a link. Free use is non-commercial and under 10,000 calls a day, 5,000 an hour and 600 a minute.

## Roadmap

To be written at the end, in order, with what each step needs. Current order:

1. Runner score (the "verdict") per day, with the best two-hour window.
2. Alerts when the score of a planned day changes. Needs a serverless function, a cron and storage.

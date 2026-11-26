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
- **Limit of the truth.** The ERA5 cell (37.0 N, 27.25 E) is mostly sea and the coast of the Bodrum (Halicarnassus) peninsula, with Kos town at its edge. The correction brings us closer to ERA5, not to a station in Kos.
- Units stay at the API defaults (°C, km/h, mm) and every value in the UI shows its unit.
- The place comes from the Geocoding API. A search for "Kos" without a country returns Kūstī (Sudan) and Košice (Slovakia) first; with `countryCode=GR` the first result is Kos town (36.893 N, 27.288 E, population 19,244). Default: Kos town.

## Proposals rejected

- **Next.js with a server route in front of Open-Meteo** (proposed by the AI in planning). Chosen instead: a static Vite site with no backend. Why: nothing to run or secure, fewer moving parts in 6 hours. Cost: no shared cache, and score-change notifications will need a serverless function later.
- **Runner score (the "verdict")** as the extension. Chosen instead: the second opinion. It moves to the roadmap.
- **Laravel with an AI SDK**, after a 2020 Laravel News article on `vemcogroup/laravel-weather`. Chosen instead: stay on the static Vite site. Why: that package wraps Dark Sky and weatherstack, which are keyed providers, and Dark Sky no longer accepts sign-ups. Open-Meteo needs no backend. A PHP host plus an LLM key would cost 2 to 3 of the remaining ~4:50 hours. An AI-written explanation could come later as a serverless function.
- **Dropping `hourly` from the base Forecast call** (proposed by the AI before step 4: 44 KB to 2.6 KB, request weight 5.5 to 3.75). Chosen instead: keep it. Why: the contract is already merged, and the change would touch the brief, the type, the fixture and the tests for no visible gain. If nothing uses `hourly` after step 6, it goes then. (The instrument now uses it.)
- **Decision rule without a margin** (the first draft of `docs/architecture.md`: the correction wins whenever its MAE is lower). Chosen instead: it wins only if it is at least 0.1 °C better. Why: otherwise the badge can say "0.0 °C better".
- **80% band from the corrected errors only** (same draft). Chosen instead: from the errors of the line we show, the source's when the source wins. Why: the band has to describe the line on screen.
- **Rain bars inside the temperature chart, without an axis** (the mockup in `docs/ui-design.md`). Chosen instead: a rain chart of its own under the temperature, with a mm axis and the same dates. Why: every value shows its unit.
- **Space Grotesk and Inter** (the mockup). Chosen instead: system fonts. Why: nothing to load and no third-party request.
- **The first UI, built from the mockup** (cards and stock charts, proposed by the AI). Chosen instead: the instrument in `docs/PRODUCT.md`. Why: too basic and too static for a page that should feel live.
- **The simple layouts** (the card mockup and the instrument page, both one page without a menu). Chosen instead: dashboard v2, with a menu, views, layers and options in each box; the instrument stays as a second dashboard. Why: no menu and no options per box.
- **Cuts to fit the 3:40 left** (proposed by the AI: the next 7 days as a table only in step 4, "± X.X °C" instead of the 80% band, no series toggles, a shorter rehearsal). Chosen instead: the full plan, about 7:00 in all. Why: Petros cares more about the full scope than about the 6-hour estimate.

## What real responses taught us (2026-11-25)

- **Three grid cells, not one.** Forecast (default model): 36.875 N, 27.324 E. ERA5: 36.872 N, 27.237 E, about 8 km west. Multi-model call (`models=ecmwf_ifs025,gfs_seamless,icon_seamless`): 37.0 N, 27.5 E, a coarse cell partly over sea. Part of any "bias" is this location gap; the correction absorbs it, which is what we want for Kos town.
- **Multi-model names:** each variable gets the model id as a suffix, e.g. `temperature_2m_max_ecmwf_ifs025`. An unknown model id returns HTTP 400 with a `reason`.
- **Daylight saving:** the ERA5 sample (29 May to 24 Nov) has one fixed `utc_offset_seconds` (+2 h) and no missing or repeated hour on 25 October. Before that date, its hours are one hour off local summer time. The backtest window (last weeks) is after the change, so it is not affected now.
- **Previous Runs `_previous_day7`** jumps at midnight (e.g. 17.6 to 18.8 °C): each day comes from a different run. Aggregate per local day, never across midnight.
- **Fixtures** live in `src/lib/fixtures/`. The Previous Runs one has lead days 1, 3 and 7 for 15 days; the live call will ask for 1 to 7.

## What real responses taught us (2026-11-26)

- **Requests have a weight.** The `X-RateLimit-Cost` header counts days and variables: the full Forecast request is 5.5 calls, a 7-day refresh 2.2. So the refresh leaves the history out.
- **The archive default is not ERA5.** Without `models`, 336 of 336 hours (12 to 25 November) equal `ecmwf_ifs`, on its cell (36.872 N, 27.237 E), with no gap up to yesterday. With `models=era5` the cell is 37.0 N, 27.25 E, the last full day was 19 November, and the hours differ by 0.68 °C on average. `kos-era5.json` has the `ecmwf_ifs` cell, so the "ERA5" cell in the list above is really the default's. Decided: `models=era5`, and `kos-era5.json` is replaced with 90 days from it (28 August to 25 November).
- **About 35 days of history cannot feed the backtest.** With a 21-day bias window and the real ERA5 lag they leave 1 backtest day at lead 1 and none after it, under our own n ≥ 10 rule. 90 days leave 50 to 56. Decided: 90 days.
- **ERA5 ends in `null`.** In the new fixture the last 142 hours of every field are `null`, from 20 November 02:00: the last full day is 19 November, and 20 November has 2 hours. A day counts only with all 24. The shared type allows `null` for ERA5 only, the one response that sends it.
- **The clock change is inside the 90 days.** Both APIs answer with one fixed +2 h, and 25 October has 24 distinct hours, so forecast and truth stay aligned. Before that date a "local day" runs from 01:00 to 01:00 summer time.

## Step 4: dashboard v2 (2026-11-26)

- **Third layout.** Petros drew dashboard v2 (menu, views, layers, boxes with their own options) and asked for a live scene as its main box, with the instrument kept as a second dashboard. `docs/ui-design.md` describes it.
- **Live over Kos.**
  - The coastline around Kos sits on a plane tilted with CSS perspective (no 3D library).
  - Wind particles move where and as fast as the wind of that hour.
  - Rain falls as hard as its mm/h: light up to 2.5, moderate up to 7.6, heavy above (`rainLevel` in `hours.ts`).
  - The land takes the colour of the air temperature, and the layers switch each part on and off.
  - A timeline runs from the past 28 days to the next 7 (the history's hourly rows are kept for it), with Play and Now. Under it, Wind, Rain or Temperature day by day, the forecast shaded; a click moves the scene to that day.
  - Under reduced motion the particles become still arrows and the rain stops moving.
- **Right now:** the now tile shows today's min-to-max bar with a marker that glides on a new reading. The wind tile has a vane whose streaks run faster in stronger wind, and a 16-point direction (327° is NNW).
- **Next 48 hours, next 7 days, past 28 days** follow the mockup and the layers; the 28-day numbers come from `pastNumbers` in `days.ts`. The step 6 parts (track record, second-opinion tile, the Source/Corrected/80% band switches, the Ours/80%/Gap columns) are in place, empty or disabled, with a note.
- **Coastline:** Natural Earth 1:10m land and minor islands (public domain), clipped, projected and simplified by `scripts/kos-map.mjs` into one 5 KB SVG path. Not a library and not an API: the page never fetches map data.
- **Weight:** the first load is 85 KB gzip; Recharts and each chart load after it.
- **Checked in headless Chrome** over the DevTools Protocol (2026-11-26), with the fixture and with live data, at 1280 px and 390 px:
  - The wind canvas changes from frame to frame. 2 November 10:00 (6.0 mm/h) shows moderate rain and a darker sky; a dry hour shows none.
  - Play advances the timeline and Pause stops it; Now returns. Wind, Rain and Temperature switch the strip, and a click on the strip moves the scene.
  - Every layer hides and shows its charts; all off shows the empty message. Max/Min switches the 7-day table.
  - Views jump to their box and mark it. The menu folds and unfolds. Instrument opens, survives a reload, and goes back.
  - On the phone the drawer opens, Esc closes it and focus returns to "Menu". Nothing scrolls sideways; no console errors.
- **The 28-day numbers on the fixture** match the mockup: warmest 23.7 °C (20 Nov), coolest night 12.1 °C (8 Nov), wettest 66.8 mm (2 Nov), 150 mm over 9 days of 1 mm or more, strongest gust 59 km/h (7 Nov).

## Live (2026-11-26)

- **https://weather-quick-rho.vercel.app**, Vercel project `weather-quick` (Hobby), production, deployed by hand from `feat/ui-base` at 54ef6a7 with Vercel CLI 66.2.0 (the newest release at least 7 days old; 67.0.0 was hours old). Not yet connected to Git, so a push does not deploy.
- **Before the deploy:** gitleaks over the whole history (39 commits) and the working tree found no leaks; `npm audit` found 0 vulnerabilities. trivy is not installed here, so `npm audit` stood in for it.
- **After the deploy:** the page and its script answer 200 without login, with the same build hash as locally. The Linux build installed 90 packages from our lockfile and built in 7 s, so the restored `@emnapi` entries work there too. Every control was clicked on the live site with live data, with no console errors.

## Dependencies

- Vite + React + TypeScript from the official `react-ts` template (it lints with oxlint).
- `vitest` added as the test runner: the unit-test rule needs one, and it is Vite's own.
- **Recharts 3.10.1**, exact version, approved on 2026-11-26 as the one chart library. It is installed in the step 4 PR, not before. Why: JSX that is easy to change live in the review call, SVG, and a ready range area for the step 6 band. Cost: it is the heaviest of the four measured (gzip over React: Recharts 137 KB, Observable Plot 95 KB, Chart.js 65 KB, uPlot 23 KB; Recharts measured on 3.11.1), so it loads lazily. 3.10.1 because 3.11.1 was three days old.
- **Lockfile rule for that install:** it may only add Recharts and its dependencies. On Windows, `npm install` had removed the `@emnapi` entries in two old worktrees, which could break `npm ci` elsewhere. If anything else disappears, we stop before committing. It happened in step 4: see Rough edges.

## Rough edges

- On 2026-11-25 the Previous Runs and ERA5 (archive) APIs answered "Daily API request limit exceeded" from the shared cloud IP on 2026-11-25. Visitors call from their own IPs, but a busy shared network (office, VPN) could hit the same limit. The page must then show the source alone and say why.
- **npm on Windows drops two lockfile entries** (`@emnapi/core` and `@emnapi/runtime`, for the wasm32 Rolldown binding). The Recharts commit puts them back exactly as they were; any later `npm install` on Windows needs the same check. `npm ci` passes on Windows; on Linux it is untested until the Vercel deploy.
- **Codex review is not connected.** PR #1 and PR #3 got no review, even after an explicit `@codex review`. Until it is, Petros reviews each PR.
- **Security headers are in `vercel.json` but not live yet.** CSP (self, plus the three Open-Meteo API hosts), nosniff, `X-Frame-Options: DENY`, Referrer-Policy and Permissions-Policy. Tested on the built `dist` behind the same headers in Chromium: live data loads and every visible button clicks with no console or CSP errors. The live site gets them on the next deploy; until then it sends only HSTS. Vercel's `Access-Control-Allow-Origin: *` on static files stays: the files are public anyway.
- **No dark mode.** The design has light tokens only, so the page sets `color-scheme: light`.
- **Step 6 needs a colour for the corrected trace** that stands apart from the ink of the source trace and from the signal colour, and passes the `dataviz` validator. The mockup pair (grey and blue) failed it (ΔE 10.6, below 15).
- **The trace redraws on every cursor move** (about 170 points). Smooth on a laptop; not measured on a slow phone.
- **One reading moves the whole live scene.** Open-Meteo gives wind, rain and temperature for the Kos grid cell, so every particle and drop follows the same values; it is not a wind field like a weather map's. A real field needs more points (Open-Meteo takes several coordinates in one call): a new request and a type change, so it waits for an OK.
- **The coastline is 1:10m.** Good for the shape of Kos and its neighbours, not for coves or harbours.
- **More variables are possible.** Open-Meteo also gives cloud cover, pressure, humidity, visibility, sunshine, and waves through the Marine API. Each would change the shared type (cloud cover could draw clouds on the scene); they wait for an OK and a real sample.
- **On a phone** the instrument's day columns are tight (about 44 px each), so the sky text shows only in the reading.
- **The 10-minute refresh was not watched in a browser.** The rule and the timing are unit-tested, and the refresh request was checked live (HTTP 200, 7 days).

## Data licence

Open-Meteo data is CC BY 4.0. The footer says "Weather data by Open-Meteo.com" with a link. Free use is non-commercial and under 10,000 calls a day, 5,000 an hour and 600 a minute.

## Roadmap

To be written at the end, in order, with what each step needs. Current order:

1. Runner score (the "verdict") per day, with the best two-hour window.
2. Alerts when the score of a planned day changes. Needs a serverless function, a cron and storage.

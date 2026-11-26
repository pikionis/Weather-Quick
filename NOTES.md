# Notes

Working notes for the reviewers: what we chose, what we assumed and why. Written as we go.

## What we chose

- **Place:** Kos town, Greece (36.893 N, 27.288 E, Europe/Athens). Open-Meteo snaps it to the grid cell at 36.875 N, 27.324 E, elevation 11 m: a coastal cell, about 3 km east of town. Kos is the fixed default. If search makes it in, every result shows country and region (`country`, `admin1`) so that Kos is not confused with other places called "Kos".
- **Base:** weather now, the past 28 days and the next 7 days, from one Forecast API call (`past_days=28`, `forecast_days=7`, `timezone=auto`). Current conditions and the forecast refresh every 10 minutes; history and the backtest load once per page load.
- **Extension:** the *second opinion*. Our corrected forecast next to the source, with the gap and our confidence. See `docs/adr/0002-bias-correction.md`.
- **Stack:** Vite + React + TypeScript, static site on Vercel, no backend. Open-Meteo is keyless, so no key exists to leak. See `docs/adr/0001-static-vite-no-backend.md`.

## How we work

- **One window, one step at a time.** I started with two parallel windows and moved to one, because only steps 4 and 5 could run in parallel. The two windows (worktrees, double setup, coordination) cost more time than they saved. With one agent and one step per PR, in order, it is easier for me to follow and check the work.
- **Step 5 began twice.** A Claude Code project thread opened PR #7 while this window was still writing its plan. This window did not start over. It fetched the Previous Runs sample itself (no value differs from the fixture) and recomputed the backtest table with a script written without reading the code (the same numbers). Then it added its commits to the same branch.

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
- **The 80% band as percentiles of shown − truth, flipped into a range** (the first step 5 code, PR #7). Chosen instead: percentiles of truth − shown, added to the shown value. Why: built the first way, the band is easy to add with the wrong sign, and then it comes out mirrored whenever the errors lean one way. Tested with lopsided errors.
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
- **Fixtures** live in `src/lib/fixtures/`. The first Previous Runs one had lead days 1, 3 and 7 for 15 days; step 5 replaced it with 90 days and lead days 1 to 7.

## What real responses taught us (2026-11-26)

- **Requests have a weight.** The `X-RateLimit-Cost` header counts days and variables: the full Forecast request is 5.5 calls, a 7-day refresh 2.2. So the refresh leaves the history out.
- **The archive default is not ERA5.** Without `models`, 336 of 336 hours (12 to 25 November) equal `ecmwf_ifs`, on its cell (36.872 N, 27.237 E), with no gap up to yesterday. With `models=era5` the cell is 37.0 N, 27.25 E, the last full day was 19 November, and the hours differ by 0.68 °C on average. `kos-era5.json` has the `ecmwf_ifs` cell, so the "ERA5" cell in the list above is really the default's. Decided: `models=era5`, and `kos-era5.json` is replaced with 90 days from it (28 August to 25 November).
- **About 35 days of history cannot feed the backtest.** With a 21-day bias window and the real ERA5 lag they leave 1 backtest day at lead 1 and none after it, under our own n ≥ 10 rule. 90 days leave 50 to 56. Decided: 90 days.
- **ERA5 ends in `null`.** In the new fixture the last 142 hours of every field are `null`, from 20 November 02:00: the last full day is 19 November, and 20 November has 2 hours. A day counts only with all 24. The shared type allows `null` for ERA5 only, the one response that sends it.
- **The clock change is inside the 90 days.** Both APIs answer with one fixed +2 h, and 25 October has 24 distinct hours, so forecast and truth stay aligned. Before that date a "local day" runs from 01:00 to 01:00 summer time.
- **The Forecast API's daily max and min are not the max and min of its hours.** On the forecast fixture they differ on 9 of 35 days. The daily max is 0 to 0.4 °C higher and the daily min 0 to 0.6 °C lower, never the other way. The bias is measured on hours (Previous Runs and ERA5 are hourly), so the correction applies to the hourly forecast, aggregated the same way (`sourceDays`). Petros confirmed the hourly source on 2026-11-26, knowing that a few Source values then differ from the daily fields in the designs. The Forecast API's past hours equal Previous Runs' `temperature_2m` in 690 of 696 shared hours (worst 0.3 °C), so both serve the same best_match series.

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

## Step 5: the second opinion, logic only (2026-11-26)

- **New Previous Runs fixture.** The old one (15 days, lead days 1, 3 and 7) gave no backtest day at all. `kos-previous-runs.json` now holds the same 90 days as ERA5, 28 August to 25 November, lead days 1 to 7, default model (best_match), fetched from the cloud session on 2026-11-26 with:
  `previous-runs-api.open-meteo.com/v1/forecast?latitude=36.893&longitude=27.288&hourly=temperature_2m,temperature_2m_previous_day1,...,temperature_2m_previous_day7&timezone=Europe/Athens&start_date=2026-08-28&end_date=2026-11-25`
  2,160 hours per column, no `null`, cell 36.875 N, 27.324 E, one fixed +2 h offset. On the 15 days they share, lead days 1, 3 and 7 equal the old fixture to the decimal. The request weighs 5.1 calls. The same request with `models=best_match`, sent from this machine the same day, returned the same values in all 8 columns.
- **Code** in `src/lib/correction/`:
  - `align`: hourly to daily max and min by local date, a day only with all 24 hours.
  - `bias`: mean error of the latest 21 days known on D − L − 7; `null` with fewer, never a mean of fewer.
  - `backtest`: replays every date with a full window, then MAE, winner, band and today's bias per variable and lead.
  - `metrics`: MAE, percentile, the 0.1 °C / 10-day rule, band.
  - `forecast`: today's second opinion for each forecast day and variable: the source, today's bias, the line we show, our value, the gap and the 80% range. Step 6 only displays it.
  - `dates`.
  - Clients: `previousRunsClient.ts` and `era5Client.ts` (`models=era5`), both on a shared `fetchJson.ts` with the same never-throw contract as `fetchForecast`.
- **No look-ahead, tested.** On the fixtures, for lead days 1, 4 and 7, moving every ERA5 hour after D − L − 7 by +10 °C leaves the bias for D identical. Moving D − L − 7 itself changes it, so the test can fail.
- **Band.** The 10th and 90th percentile of truth − shown, for the line we show: ours where ours wins, the source's where it wins. The range is shown + p10 to shown + p90. Hidden under 10 days. A test with lopsided errors checks that it does not come out mirrored.
- **Today has no correction.** Our lead days start tomorrow, so `forecast` leaves today as the source gives it.
- **The four states of the Now tile** can be read from the same results:
  - ours wins: `winner` is `ours` at a lead;
  - the source wins: no lead won;
  - too few days: `n` under 10, so no band and the source;
  - data missing: no results, so `opinionFor` gives the source alone.

### Backtest on the fixtures (today = 25 November)

How to read the table:
- **MAE:** the mean of |forecast − ERA5|, in °C. Ours wins only with an MAE at least 0.1 °C lower over at least 10 days.
- **Band:** truth − shown, for the line we show. On 8 of 10 backtest days the truth fell between shown + low and shown + high.
- **Today's bias:** forecast − ERA5, the mean of the 21 days up to 18 November. Ours subtracts it where ours is shown.

| Variable | Lead | Days | MAE source | MAE ours | Winner | 80% band (truth − shown) | Today's bias |
| --- | --- | --- | --- | --- | --- | --- | --- |
| max | 1 | 56 | 1.26 | 1.23 | source | −2.45 to 0.25 | 0.51 |
| max | 2 | 55 | 1.21 | 1.26 | source | −2.72 to 0.20 | 0.42 |
| max | 3 | 54 | 1.28 | 1.41 | source | −2.94 to 0.27 | 0.39 |
| max | 4 | 53 | 1.29 | 1.55 | source | −2.98 to 0.28 | 0.27 |
| max | 5 | 52 | 1.41 | 2.04 | source | −3.08 to 0.29 | 0.29 |
| max | 6 | 51 | 1.47 | 2.20 | source | −2.90 to 0.50 | 0.19 |
| max | 7 | 50 | 1.42 | 1.79 | source | −3.01 to 0.04 | 0.27 |
| min | 1 | 56 | 0.94 | 0.86 | source | −0.40 to 1.95 | −0.62 |
| min | 2 | 55 | 0.98 | 0.83 | ours | −1.21 to 1.81 | −0.73 |
| min | 3 | 54 | 1.01 | 0.85 | ours | −1.24 to 1.37 | −0.75 |
| min | 4 | 53 | 1.10 | 0.98 | ours | −1.23 to 1.88 | −0.87 |
| min | 5 | 52 | 2.13 | 1.35 | ours | −2.62 to 1.76 | −2.09 |
| min | 6 | 51 | 2.23 | 1.41 | ours | −1.96 to 2.44 | −2.39 |
| min | 7 | 50 | 1.33 | 1.37 | source | −0.80 to 2.44 | −1.49 |

- **The source wins the daily max at every lead day.**
  - It runs warm: the mean error is +1.0 to +1.2 °C.
  - But that warm error fell week by week, from +4 to +7 °C in late August and early September to about 0 in November.
  - The bias window ends 8 to 14 days before the day it corrects. So it subtracts last month's error and overshoots, more at longer leads.
  - One likely cause is the truth: the ERA5 cell is mostly sea, which keeps the summer maximum down. Not tested.
- **Ours wins the daily min at lead days 2 to 6**, by 0.12 to 0.82 °C.
  - The source's min at lead days 5 and 6 runs about 2 °C cold in almost every week: a mean of −1.9 and −2.1 °C, against −0.8 at the other leads. That is a repeating error, which is what the correction is for. We have not checked why these two leads differ.
  - At lead 1 the gain is 0.08 °C, under the 0.1 rule, so the source stays. At lead 7 the source wins.
- **The page will say so**: for the max, "the source wins" at every lead; for the min, our correction at 2 to 6 days ahead.
- **Checked twice.** A separate script, written without reading `src/lib/correction`, gave the same n, MAE, winner, band and today's bias in every row.

### Today's second opinion on the fixtures (25 November)

This is what step 6 will show in Next 7 days, from `correctedForecast` with the hourly source. Values are in °C, and the gap is ours − source. The source here is the hourly max and min, so a few values differ from the daily fields in `docs/design/`: Sat 28 min 18.0, not 17.6; Mon 30 min 13.5, not 13.2; Tue 1 13.8 and 9.2, not 13.9 and 9.0.

| Day | Max source | Max ours | Max 80% range | Max gap | Min source | Min ours | Min 80% range | Min gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Today | 16.1 | no correction | — | — | 12.5 | no correction | — | — |
| Thu 26 | 17.8 | = source | 15.4 to 18.1 | 0.0 | 13.4 | = source | 13.0 to 15.3 | 0.0 |
| Fri 27 | 19.8 | = source | 17.1 to 20.0 | 0.0 | 14.9 | 15.6 | 14.4 to 17.4 | +0.7 |
| Sat 28 | 18.9 | = source | 16.0 to 19.2 | 0.0 | 18.0 | 18.7 | 17.5 to 20.1 | +0.7 |
| Sun 29 | 19.2 | = source | 16.2 to 19.5 | 0.0 | 16.8 | 17.7 | 16.4 to 19.5 | +0.9 |
| Mon 30 | 17.9 | = source | 14.8 to 18.2 | 0.0 | 13.5 | 15.6 | 13.0 to 17.3 | +2.1 |
| Tue 1 | 13.8 | = source | 10.9 to 14.3 | 0.0 | 9.2 | 11.6 | 9.6 to 14.0 | +2.4 |

## Designs for the second opinion and the runner verdict (2026-11-26)

- `docs/design/` holds three artboards from the Claude Design canvas: the second opinion filled in (step 6), the four states of its Now tile, and the runner verdict. Its README says what each file shows and what was decided.
- **The runner verdict is the brief's option A.** Petros asked for it as well; it is designed here and not built yet.
- **Corrected trace `#0B6FD6`, source `#5C6670` dashed.** Checked with the `dataviz` validator: ΔE 16.5 against the source grey, 34.7 against the ink and 35.8 against the signal colour.

## Live (2026-11-26)

- **https://weather-quick-rho.vercel.app**, Vercel project `weather-quick` (Hobby), production, deployed by hand from `feat/ui-base` at 54ef6a7 with Vercel CLI 66.2.0 (the newest release at least 7 days old; 67.0.0 was hours old). Connected to Git on 2026-11-26: every push to `main` deploys to production.
- **Before the deploy:** gitleaks over the whole history (39 commits) and the working tree found no leaks; `npm audit` found 0 vulnerabilities. trivy is not installed here, so `npm audit` stood in for it.
- **After the deploy:** the page and its script answer 200 without login, with the same build hash as locally. The Linux build installed 90 packages from our lockfile and built in 7 s, so the restored `@emnapi` entries work there too. Every control was clicked on the live site with live data, with no console errors.

## Security check of the live site (2026-11-26)

- **Headers.** The page, a script and a 404 all send the same set (`curl -I`), and a `304 Not Modified` sends none of them (see the ZAP result). The set:
  - `Content-Security-Policy`:
    - `default-src 'self'`, with scripts and styles from self only;
    - `connect-src` is self plus the three Open-Meteo hosts;
    - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `frame-ancestors 'none'`.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (Vercel's). Plain HTTP answers 308 to HTTPS.
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy`, with camera, microphone, geolocation, payment and USB off.
  - `Access-Control-Allow-Origin: *` comes from Vercel on static files. It stays, because the files are public anyway.
- **CSP in a real browser.** Headless Chrome ran on the live site, listening for `securitypolicyviolation`, the browser's security log and blocked requests.
  - It covered both dashboards and the phone width, clicked every visible button (22) and hovered every chart (20).
  - Result: 0 violations, 0 blocked requests and no console errors.
  - A positive control at the end, a `fetch` to example.com (not allowed), was caught by both listeners. So the check can fail.
- **ZAP baseline.** The workflow is `.github/workflows/zap-baseline.yml`:
  - run by hand only (`workflow_dispatch`);
  - `zaproxy/action-baseline` pinned to the v0.15.0 commit, with ZAP's `stable` image;
  - `permissions: contents: read` and `allow_issue_writing: false`;
  - browser crawl on (`-j`), and the reports kept as the run's artifact.

  ZAP is not installed on this machine (no Java, no Docker), so it runs on GitHub. GitHub starts a hand-run workflow only from the default branch (from this branch, `gh workflow run` answered 404), so the file went to `main` first, in #8.
- **ZAP result.** Run 45864175713 on `main` at f784eba (2026-11-26), with ZAP 2.17.0. The reports are the run's artifact `zap-baseline`, kept until 2027-02-24.
  - 26 URLs, with the browser crawl: it loaded the lazy chart files and the Open-Meteo call.
  - 0 High and 0 failures. 61 rules pass, among them CSP, clickjacking, nosniff, Permissions-Policy, cookies and known-vulnerable JS libraries (Retire.js).
  - 8 alerts, the three about caching in one row:

  | Risk | Alert | Where | What we do |
  | --- | --- | --- | --- |
  | Medium | Cross-Domain Misconfiguration | page, script, style and favicon: `Access-Control-Allow-Origin: *` | Accepted. Vercel sends it on static files. The site has no login, no cookies and no API of its own, so another site can read only files anyone can download. |
  | Low | Strict-Transport-Security not set | 5 answers in the browser crawl | Not a gap. They are `304 Not Modified` answers, and Vercel sends a 304 with none of our headers (only Cache-Control, Date, ETag, Server and X-Vercel-*). A 304 only revalidates a copy that came with a 200, every 200 carries HSTS, and the browser keeps the stored copy's headers. A missing header does not clear HSTS; only `max-age=0` does. |
  | Low | Cross-Origin-Opener-Policy missing | the page | Open. `same-origin` would cut the handle between our window and a page on another site that opens it or is opened by it. The site opens no pop-ups, so it would cost nothing. It is one header in `vercel.json`, outside step 5's files. |
  | Low | Cross-Origin-Embedder-Policy missing | the page | Not needed. It only matters for cross-origin isolation (for example `SharedArrayBuffer`), which the site does not use. |
  | Info | Modern Web Application | the page | Expected: the page is built by JavaScript, which is why the crawl uses a browser. |
  | Info | Re-examine Cache-control, Storable but Non-Cacheable, Retrieved from Cache | page, files, the 404s for `robots.txt` and `sitemap.xml` | Caching is safe, since nothing personal is served. One real point, on speed: see Rough edges. |

## Dependencies

- Vite + React + TypeScript from the official `react-ts` template (it lints with oxlint).
- `vitest` added as the test runner: the unit-test rule needs one, and it is Vite's own.
- **Recharts 3.10.1**, exact version, approved on 2026-11-26 as the one chart library. It is installed in the step 4 PR, not before. Why: JSX that is easy to change live in the review call, SVG, and a ready range area for the step 6 band. Cost: it is the heaviest of the four measured (gzip over React: Recharts 137 KB, Observable Plot 95 KB, Chart.js 65 KB, uPlot 23 KB; Recharts measured on 3.11.1), so it loads lazily. 3.10.1 because 3.11.1 was three days old.
- **Lockfile rule for that install:** it may only add Recharts and its dependencies. On Windows, `npm install` had removed the `@emnapi` entries in two old worktrees, which could break `npm ci` elsewhere. If anything else disappears, we stop before committing. It happened in step 4: see Rough edges.
- **`zaproxy/action-baseline` v0.15.0** (released 2025-10-24), for the passive ZAP scan of the live site, approved on 2026-11-26. It is a GitHub Action, not an npm package, so nothing reaches the site. It is pinned to its commit (`de8ad96…`), not to a tag. The workflow runs only by hand, reads the repo only (`contents: read`) and opens no issues; the report stays as the run's artifact. It went to `main` in a PR of its own, before step 5, because GitHub starts a hand-run workflow only from the default branch. The findings are in the step 5 PR.

## Rough edges

- On 2026-11-25 the Previous Runs and ERA5 (archive) APIs answered "Daily API request limit exceeded" from the shared cloud IP on 2026-11-25. Visitors call from their own IPs, but a busy shared network (office, VPN) could hit the same limit. The page must then show the source alone and say why.
- **npm on Windows drops two lockfile entries** (`@emnapi/core` and `@emnapi/runtime`, for the wasm32 Rolldown binding). The Recharts commit puts them back exactly as they were; any later `npm install` on Windows needs the same check. `npm ci` passes on Windows; on Linux it is untested until the Vercel deploy.
- **Codex review is not connected.** PR #1 and PR #3 got no review, even after an explicit `@codex review`. Until it is, Petros reviews each PR.
- **Security headers are live** since the deploy of `main` at db5a8db (2026-11-26). "Security check of the live site" lists them, how they were checked and the ZAP result.
- **The hashed files in `/assets/` are not cached for long.** Vercel serves them, like the page, with `max-age=0, must-revalidate`, so every visit asks again for each file and gets a 304. Their names change with their content, so `public, max-age=31536000, immutable` on `/assets/` would be safe. It is one header in `vercel.json`, outside step 5's files.
- **`fetchJson.ts` repeats `fetchForecast`.** It is the same never-throw code. `forecastClient.ts` belongs to step 4, and `fetchJson.ts` is outside the step 5 brief's file list, so the two stay apart until a clean-up.
- **The ERA5 client also asks for dew point and wind**, because the shared `Era5HourlyField` type lists them. The correction reads temperature only.
- **A comment in `openMeteo.ts`** still says the Previous Runs sample has lead days 1, 3 and 7. It is a shared type, so it waits for an OK.
- **A missing ERA5 day stretches the bias window** one day further back: the bias takes the latest 21 days that have both values, never fewer. The fixtures have no such gap.
- **No dark mode.** The design has light tokens only, so the page sets `color-scheme: light`.
- **Step 6 needs a colour for the corrected trace** that stands apart from the ink of the source trace and from the signal colour, and passes the `dataviz` validator. The mockup pair (grey and blue) failed it (ΔE 10.6, below 15). Chosen in `docs/design/`: `#0B6FD6` (see "Designs for the second opinion and the runner verdict"); step 6 puts it in the code.
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

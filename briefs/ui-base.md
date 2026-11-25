# Brief: UI base

Step 4. Branch `feat/ui-base`, from the updated `main`.

## Goal

The base of the brief: for Kos, show the weather now, the past 28 days and the next 7 days. Every value shows its unit.

## Files you own

- `src/App.tsx`, `src/index.css`
- `src/components/**`
- `src/lib/forecastClient.ts` and its test: builds the Forecast API URL, fetches it, returns `ForecastResponse` or `ApiError`.

Read only: `src/lib/openMeteo.ts`, `src/lib/location.ts` (shared types: change only with Petros's OK), `src/lib/fixtures/**`.

## Rules

- Request exactly the fields in `docs/open-meteo-brief.md` section 1, with `past_days=28`, `forecast_days=7`, `timezone=auto`.
- Refresh current conditions and the forecast every 10 minutes. History loads once per page load.
- Error state shows the API `reason`. Loading and empty states too.
- Footer: "Weather data by Open-Meteo.com" with a link (already in App).
- One chart library. Propose one to Petros, with the reason, before installing it.
- No second opinion here. Leave a slot in the 7-day view where the corrected forecast will go.

## Pull request

- Open a PR from the branch to `main`, so Codex reviews it before the merge. Merge only with Petros's OK.
- Update `NOTES.md` in the same PR: what was decided, rejected or left rough.

## Done

Works in the browser on fixtures and live, tests pass, lint passes, committed, `NOTES.md` updated.

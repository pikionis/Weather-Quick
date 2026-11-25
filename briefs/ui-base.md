# Brief: UI base

Owner: worker window "ui". Worktree `../weather-quick-ui`, branch `feat/ui-base`.

## Goal

The base of the brief: for Kos, show the weather now, the past 28 days and the next 7 days. Every value shows its unit.

## Files you own

- `src/App.tsx`, `src/index.css`
- `src/components/**`
- `src/lib/forecastClient.ts` and its test: builds the Forecast API URL, fetches it, returns `ForecastResponse` or `ApiError`.

Read only: `src/lib/openMeteo.ts`, `src/lib/location.ts` (shared types, architect only), `src/lib/fixtures/**`.

## Rules

- Request exactly the fields in `docs/open-meteo-brief.md` section 1, with `past_days=28`, `forecast_days=7`, `timezone=auto`.
- Refresh current conditions and the forecast every 10 minutes. History loads once per page load.
- Error state shows the API `reason`. Loading and empty states too.
- Footer: "Weather data by Open-Meteo.com" with a link (already in App).
- One chart library. Propose one to Petros, with the reason, before installing it.
- No second opinion here. Leave a slot in the 7-day view where the corrected forecast will go.

## Pull request

- Work only on your branch, and open a PR from it to `main`, so Codex reviews it before the merge. The architect window merges.
- Do not write to `NOTES.md`. Put what you decided, rejected or left rough in the PR description; the architect moves it into `NOTES.md` at merge.

## Done

Works in the browser on fixtures and live, tests pass, lint passes, committed. Rough edges and decisions go in the PR description; the architect window moves them into NOTES.md at merge.

# Brief: second opinion (correction and backtest)

Owner: worker window "correction". Worktree `../weather-quick-correction`, branch `feat/second-opinion`.

## Goal

Pure functions that turn Previous Runs + ERA5 into a corrected daily forecast per lead day, a backtest without look-ahead, and a confidence per lead day. Method: `docs/adr/0002-bias-correction.md`.

## Files you own

- `src/lib/correction/**`: `align.ts` (hourly to daily in local time, join forecast and truth by date), `bias.ts`, `backtest.ts`, `metrics.ts`, each with a `*.test.ts`.
- `src/lib/previousRunsClient.ts`, `src/lib/era5Client.ts` and their tests.

Read only: `src/lib/openMeteo.ts`, `src/lib/location.ts` (shared types, architect only), `src/lib/fixtures/**`. Need a new shared type? Ask the architect window.

## Rules

- No look-ahead: the correction for day D uses only data known before D. Write a test that fails if it does.
- Daily max and min temperature first. Daily values in local time (Europe/Athens).
- ERA5 lags: days without truth stay out of the backtest.
- The fixture has lead days 1, 3 and 7 only, for 15 days. Tests use it; the live client requests days 1 to 7.
- If the backtest shows the source is better, return that result, do not hide it.
- No UI, no new dependency.

## Done

Tests pass (including the look-ahead test), lint passes, committed. Put the backtest numbers on the fixture and any rough edges in the PR description; the architect window moves them into NOTES.md at merge.

# Brief: second opinion (correction and backtest)

Step 5, after `feat/ui-base` is merged. Branch `feat/second-opinion`, from the updated `main`.

## Goal

Pure functions that turn Previous Runs + ERA5 into a corrected daily forecast per lead day, a backtest without look-ahead, and a confidence per lead day. Method: `docs/adr/0002-bias-correction.md`.

## Files you own

- `src/lib/correction/**`: `align.ts` (hourly to daily in local time, join forecast and truth by date), `bias.ts`, `backtest.ts`, `metrics.ts`, each with a `*.test.ts`.
- `src/lib/previousRunsClient.ts`, `src/lib/era5Client.ts` and their tests.

Read only: `src/lib/openMeteo.ts`, `src/lib/location.ts` (shared types: change only with Petros's OK), `src/lib/fixtures/**`. Need a new shared type? Ask Petros.

## Rules

- No look-ahead: the correction for day D uses only data known before D. Write a test that fails if it does.
- Daily max and min temperature first. Daily values in local time (Europe/Athens).
- ERA5 lags: days without truth stay out of the backtest.
- The fixture has lead days 1, 3 and 7 only, for 15 days. Tests use it; the live client requests days 1 to 7.
- If the backtest shows the source is better, return that result, do not hide it.
- No UI, no new dependency.

## Pull request

- Open a PR from the branch to `main`, so Codex reviews it before the merge. Merge only with Petros's OK.
- Update `NOTES.md` in the same PR: what was decided, rejected or left rough.

## Done

Tests pass (including the look-ahead test), lint passes, committed, `NOTES.md` updated with the backtest numbers on the fixture and any rough edges.

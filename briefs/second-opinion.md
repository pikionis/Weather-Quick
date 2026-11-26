# Brief: second opinion (correction and backtest)

Step 5, after `feat/ui-base` is merged. Branch `feat/second-opinion`, from the updated `main`.

## Goal

Pure functions that turn Previous Runs + ERA5 into a corrected daily forecast per lead day, a backtest without look-ahead, and a confidence per lead day. Method: `docs/adr/0002-bias-correction.md`.

## Files you own

- `src/lib/correction/**`: `align.ts` (hourly to daily in local time, join forecast and truth by date), `bias.ts`, `backtest.ts`, `metrics.ts`, each with a `*.test.ts`.
- `src/lib/previousRunsClient.ts`, `src/lib/era5Client.ts` and their tests.

Read only: `src/lib/openMeteo.ts`, `src/lib/location.ts` (shared types: change only with Petros's OK), `src/lib/fixtures/**`. Need a new shared type? Ask Petros.

## Rules

- No look-ahead: the forecast issued on day D − L (lead L for date D) is corrected only with truth that existed on D − L. ERA5 lags by 7 days, so the bias uses dates up to D − L − 7. Write a test that fails if it does.
- Daily max and min temperature first. Daily values in local time (Europe/Athens).
- ERA5 comes from `models=era5`. A day enters the backtest only if it has all 24 hours; the fixture ends with a partial day (20 November, 2 hours).
- Fixtures: Previous Runs and ERA5 both cover the same 90 days (28 August to 25 November 2026); Previous Runs has lead days 1 to 7, default model (best_match). Tests use them; the live clients request lead days 1 to 7 and the last 90 days.
- The correction wins only if its MAE is at least 0.1 °C below the source's, with n ≥ 10. Otherwise return the source as the winner, do not hide it.
- The 80% band comes from the errors of the line we show: the source's when the source wins.
- No UI, no new dependency.

## Pull request

- Open a PR from the branch to `main`, so Codex reviews it before the merge. Merge only with Petros's OK.
- Update `NOTES.md` in the same PR: what was decided, rejected or left rough.

## Done

Tests pass (including the look-ahead test), lint passes, committed, `NOTES.md` updated with the backtest numbers on the fixture and any rough edges.

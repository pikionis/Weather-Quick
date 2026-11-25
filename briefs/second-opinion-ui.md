# Brief: second-opinion UI (step 6)

Owner: worker window "ui", after both `feat/ui-base` and `feat/second-opinion` are merged. Worktree `../weather-quick-ui`, new branch `feat/second-opinion-ui` from the updated `main`.

Do not start before the correction is merged: this step only displays what `src/lib/correction/` returns.

## Goal

In the 7-day view, show our corrected forecast next to the source, with the gap (°C), our confidence per lead day (± °C from the backtest) and the track record: did the correction beat the source in the backtest? If the source won, say so and show the source.

## Files you own

- `src/components/**`, `src/App.tsx`, `src/index.css`

Read only: `src/lib/**` (shared types and the correction). Need a change there? Ask the architect window.

## Rules

- No logic in components: call the functions from `src/lib/correction/`.
- Explain the method in one line on the page, with a link to ADR 0002.
- If Previous Runs or ERA5 fail (rate limit), show the source alone and say why.

## Pull request

- Open a PR from `feat/second-opinion-ui` to `main` so Codex reviews it. The architect window merges.
- Do not write to `NOTES.md`; decisions and rough edges go in the PR description.

## Done

Works in the browser on fixtures and live, tests pass, lint passes, committed, PR open.

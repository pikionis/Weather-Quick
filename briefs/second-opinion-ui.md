# Brief: second-opinion UI (step 6)

Step 6, after both `feat/ui-base` and `feat/second-opinion` are merged. Branch `feat/second-opinion-ui`, from the updated `main`.

Do not start before the correction is merged: this step only displays what `src/lib/correction/` returns.

## Goal

In the 7-day view, show our corrected forecast next to the source, with the gap (°C), our confidence per lead day (± °C from the backtest) and the track record: did the correction beat the source in the backtest? If the source won, say so and show the source.

## Files you own

- `src/components/**`, `src/App.tsx`, `src/index.css`

Read only: `src/lib/**` (shared types and the correction). Need a change there? Ask Petros.

## Rules

- No logic in components: call the functions from `src/lib/correction/`.
- Explain the method in one line on the page, with a link to ADR 0002.
- The badge says the correction won only if it was at least 0.1 °C better. The band comes from the errors of the line on screen.
- If Previous Runs or ERA5 fail (rate limit), show the source alone and say why.

## Pull request

- Open a PR from `feat/second-opinion-ui` to `main` so Codex reviews it. Merge only with Petros's OK.
- Update `NOTES.md` in the same PR: decisions and rough edges.

## Done

Works in the browser on fixtures and live, tests pass, lint passes, committed, `NOTES.md` updated, PR open.

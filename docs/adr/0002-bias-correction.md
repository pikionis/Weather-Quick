# ADR-0002: Second opinion by bias correction per lead day

- Status: Proposed (fields to be confirmed on real Previous Runs samples)
- Date: 2026-11-25
- Deciders: Petros

## Context

The brief asks for our own corrected forecast next to the source, how far apart they are, how sure we are, and why ours should beat the source. Kos is a small island: the model cell mixes land and sea, which can bias daily maximum and minimum temperatures in a repeating way. Open-Meteo's Previous Runs API returns, for past dates, what one model forecast 1 to 7 days earlier (variables with the suffix `_previous_day1` to `_previous_day7`, hourly). ERA5 from the Historical Weather API gives what happened, with the same variable names and units, a few days late. Together they make the repeating error measurable. The API sources are listed in `docs/open-meteo-brief.md`.

## Decision

We will, per variable (daily max and min temperature first) and per lead day (1 to 7):

1. Lock one model for the correction. Aggregate its Previous Runs hourly values to daily values in local time. Compute the bias: the mean of (forecast at that lead minus ERA5) over a rolling window of past days, up to the last day ERA5 covers. ERA5 comes from `models=era5`, and a day counts only if it has all 24 hours.
2. Show corrected = source minus bias, next to the source, with the gap in °C.
3. Backtest without look-ahead: the forecast issued on day D − L (lead L for date D) is corrected only with truth that existed on D − L. ERA5 lags by 7 days (measured on 2026-11-26), so the bias uses dates up to D − L − 7. Compare the mean absolute error of the source and of our correction.
4. The correction wins only if its MAE is at least 0.1 °C below the source's. Report confidence per lead (± °C) from the backtest errors of the line we show: the source's when the source wins. When the source wins, say so and show the source.

## Alternatives considered

- **An LLM as forecaster:** cannot explain why it would beat the source. Rejected.
- **A statistical model (regression on several variables):** more accurate in principle, but needs more history than fits in this budget. Roadmap candidate.
- **Average of several models (ECMWF, GFS, ICON):** a fair second opinion, but it does not learn from the place's own repeating error. Roadmap candidate.

## Consequences

- Positive: simple, explainable in one sentence, testable as pure functions.
- Negative: a short window means a noisy bias; a weather change can make last weeks' bias wrong.
- Revisit when: the backtest shows no gain, or we add station data.

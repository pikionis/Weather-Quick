# Problem brief: Weather Quick

- Owner: Petros
- Date: 2026-11-25
- Status: Approved

Our own summary of the candidate brief (dated 2026-11-24). The original is not committed.

## Problem

A forecast is a pile of numbers, and it tends to be wrong in ways that repeat. Someone planning the next days in one place wants to see the weather now, how the last weeks went, what is coming, and how far to trust it.

## Users and roles

| Actor | Goal | How often |
| --- | --- | --- |
| Visitor | See the weather in Kos now, the past weeks and the coming days | Once or twice a day |
| Visitor | Know whether to trust the forecast, and by how much | Every visit |
| Reviewer | Open the app with no account and judge the decisions | A few times this week |

## Core flows

1. Open the link and see current conditions in Kos, with units.
2. Read the past 28 days, and how the source forecast did against them.
3. Read the next 7 days: the source forecast, our corrected forecast, the gap and our confidence.
4. See plainly when the source was better than our correction.

## Success metrics

| Metric | Target |
| --- | --- |
| Backtest error (MAE, °C) of our correction vs the source, per lead day | Lower than the source, or the page says it is not |
| First load on 4G | Under 2 s |
| Live link available | Until after the review call |

## Scope and non-goals

- In scope: one place (Kos town by default, found with the Geocoding API), current / past 28 days / next 7 days, the second opinion.
- Not in scope: accounts, several places per user, storage, notifications, native apps.

## Constraints

- Time: 6 hours of work within 5 days.
- Deliverables: live link without an account, public repository with history, notes, AI prompts and logs.
- No API key in the browser. Open-Meteo is keyless.
- Must run locally for the review call, where a small live change will be asked for.

## Assumptions and risks

| Assumption or risk | How we will check or mitigate it |
| --- | --- |
| Open-Meteo has a repeating error at a coastal island cell | The backtest confirms or rejects it; both are reported |
| Previous Runs API rate limits from shared IPs | Fall back to the source alone, with a message |
| ERA5 reanalysis is a fair stand-in for observations | Stated in NOTES.md; station data is on the roadmap |
| ERA5 lags by a few days | The latest days stay out of the backtest, and the UI says so |

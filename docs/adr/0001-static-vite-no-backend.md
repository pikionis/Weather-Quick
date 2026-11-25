# ADR-0001: Static Vite site with no backend

- Status: Accepted
- Date: 2026-11-25
- Deciders: Petros

## Context

The data source, Open-Meteo, needs no API key, so nothing secret has to stay on a server. The budget is 6 hours. The app must open without an account and run locally for a review call. Expected load is a few dozen visits a day; Open-Meteo's free, non-commercial tier allows 10,000 calls a day.

## Decision

We will build a static single-page app with Vite, React and TypeScript, hosted on Vercel. The browser calls Open-Meteo directly. The correction and the backtest run in the browser, in pure functions under `src/lib`.

## Alternatives considered

- **Next.js with a server route in front of Open-Meteo:** shared cache, and a place for future keys and cron jobs. Rejected: more moving parts than this budget needs, and nothing secret to hide today.
- **SPA plus a separate API (Hono, FastAPI):** two deployables. Rejected for the same reason.

## Consequences

- Positive: nothing to run or secure on a server; `npm run dev` is the whole local setup; deploys are static files.
- Negative: no shared cache, so each visitor makes its own calls; alerts on the roadmap will need a serverless function and storage.
- Revisit when: we add a source that needs a key, or alerts.

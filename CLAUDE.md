# Weather Quick: agent instructions

## Context
Take-home for a hiring process. A small weather dashboard (now, past weeks,
next days) plus a "second opinion": our corrected forecast next to the source,
with the gap and our confidence. Budget: 6 hours. Reviewers value decisions
over polish. I will change something live in a review call, so the code must
stay small and readable.

## Reference repos (read-only, cloned next to this repo: ../principal-architect, ../project-starter, ../security-hub)
- pikionis/principal-architect: how we decide and design. It has the final
  word on technical choices.
- pikionis/project-starter: the kit this repo starts from.
- pikionis/security-hub: the security checks to pass before deploy.
Use them as guidance only. Never copy their content into this repo.

## Stack and constraints
- Vite + React + TypeScript, static site on Vercel. No backend.
- Data: Open-Meteo only (keyless). No API keys anywhere in the client.
- One chart library. Ask me before adding any other dependency.

## Parallel windows
- One architect window plans, merges and reviews. Each worker window owns
  one brief in briefs/, in its own git worktree and branch.
- Touch only the files your brief owns. Shared types change only in the
  architect window.

## How we work
- Before each step: restate the goal, list assumptions and open questions,
  propose a short plan. Wait for my OK.
- Never guess API fields. Check the Open-Meteo docs and show me a real
  sample response first. If a source returns no data, stop and tell me.
- Pure logic (alignment, correction, metrics) lives in src/lib with unit
  tests. UI components stay thin.
- After each step: run lint and tests, then one commit per logical change,
  with a clear message.
- When I reject a suggestion, add a line to NOTES.md: what was proposed,
  what I chose, why.
- Anything stubbed or rough goes in NOTES.md under "Rough edges".

## Definition of done (every step)
Works in the browser, tests pass, committed, NOTES.md updated.

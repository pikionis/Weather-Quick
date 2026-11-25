# AI prompts and logs

What we used AI for, the prompts and instructions that mattered, and what we kept or threw away. Keys and personal data are removed before anything lands here (gitleaks plus a read-through for names and e-mail addresses).

## Tools

- Claude Code (cloud session) as the architect: planning, documents, review.
- Codex review on every pull request, with the rules in `AGENTS.md`.

## Instructions

- `CLAUDE.md` and `AGENTS.md`: the standing rules for every agent in this repo.
- `docs/open-meteo-brief.md`: which Open-Meteo APIs and fields we use, written before any code so that no agent guesses API fields.

## Sessions

| Date | Session | What it produced | Kept | Thrown away, and why |
| --- | --- | --- | --- | --- |
| 2026-11-25 | Planning | Plan, NOTES.md, brief, ADRs 0001-0002, real Open-Meteo samples for Kos | Bias correction per lead day; Kos as the place | Next.js server route (more than the budget needs); copying the reference repos' files (rule: use them as guidance only); runner score as the extension (moved to the roadmap) |

| 2026-11-25 | Step 3 | `src/lib/openMeteo.ts`, fixtures, contract tests, `briefs/` | Types written only from real responses; `satisfies` checks so tsc fails when a response drifts | Guessing fields from memory (rule: never guess API fields) |

Session exports go in `ai/sessions/`.

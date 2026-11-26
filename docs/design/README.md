# Designs for steps 6 and 6b

These are the source files of three artboards from the Claude Design canvas "Weather Quick — dashboard v2" (https://claude.ai/artifact/N3Z5jX8NQbgzbdG6W6LYxz, private to Petros). A `.dc.html` file renders only inside the canvas, because it needs the canvas runtime (`support.js`). To see a design, open the canvas. To build one, read its file here as the spec. The markup, inline styles and copy are the design. The class at the bottom holds the state and the data.

| File | Artboard on the canvas | Step | What it shows |
| --- | --- | --- | --- |
| `second-opinion.dc.html` | Second opinion · step 6 | 6 | The second opinion filled in: the menu switches, the Now tile, Next 7 days (chart and table), Track record, and the "Why ours should beat the source" box |
| `second-opinion-states.dc.html` | Second opinion tile · states | 6 | The Now tile in its four states: ours wins, the source wins, data missing, too few days |
| `run-verdict.dc.html` | Best days to run · verdict | 6b | The runner verdict: the best days, one card per day, the "When do you run?" choice and "How we score" |

## Decisions in these designs

- **Colours.** Ours is `#0B6FD6`: a solid 3 px line with dots, and the 80% band at 14% opacity. The source is `#5C6670`, dashed at 2 px. The `dataviz` validator passes the pair at ΔE 16.5, where the earlier blue `#1F5FA0` failed at 10.6. White text on `#0B6FD6` (the Ours pill) is 4.9:1.
- **Next 7 days.** Today has no correction, because our lead days start tomorrow. Where the source wins, the line we show is the source, and its band comes from the source's own errors.
- **Track record.** Max or Min, and Chart or Table, so every chart also has a table view.
- **Verdict.**
  - Each hour starts at 100 and loses points for rain, wind, gusts, temperature and dew point, as the "How we score" table sets out.
  - A day's score is its best two hours in the chosen window: Morning 07–10, Midday 11–15, Evening 16–20, Any time 07–20.
  - The bands are Good from 75, OK from 50 to 74 and Poor under 50, always shown with an icon and a word. The green, amber and red are used for these bands only.

## Numbers

- The source values and the hourly data come from the real fixture of 25 November 2026, 22:45.
- Ours, the band and the track record are illustrative until step 5 runs the backtest.
- The verdict scores are computed from the fixture with the rules above, so they can serve as tests. Thursday 26, Morning: 100, at 07:00–09:00. Monday 30, Morning: 44, with rain likely (68%).

# Architecture

Status: draft for approval. No code follows until it is approved.

Weather Quick is a static single-page app. The browser calls Open-Meteo directly. There is no backend, no API key and no storage beyond the browser's memory.

## 1. Components and data flow

```mermaid
flowchart LR
  subgraph OM["Open-Meteo (keyless, CORS)"]
    FC["Forecast API<br/>current, hourly, daily<br/>past_days=28, forecast_days=7"]
    PR["Previous Runs API<br/>hourly _previous_day1..7"]
    ERA["ERA5 archive API<br/>hourly truth, ~5 days late"]
    GEO["Geocoding API<br/>only if search ships"]
  end

  subgraph BR["Browser: Vite + React static site on Vercel"]
    subgraph LIB["src/lib (pure logic, unit tested)"]
      T["openMeteo.ts<br/>types and guards"]
      LOC["location.ts<br/>KOS default"]
      FCC["forecastClient.ts"]
      PRC["previousRunsClient.ts"]
      EC["era5Client.ts"]
      GC["geocodingClient.ts<br/>optional"]
      subgraph COR["correction/"]
        AL["align.ts"]
        BI["bias.ts"]
        BT["backtest.ts"]
        ME["metrics.ts"]
      end
    end
    subgraph UI["src/components (thin)"]
      APP["App.tsx<br/>state, refresh timer"]
      NOW["CurrentPanel"]
      HIS["HistoryChart<br/>28 days"]
      FV["ForecastView<br/>7 days"]
      TG["SeriesToggles"]
      BD["TrackRecordBadge"]
      ER["ErrorState"]
      FT["Footer<br/>Open-Meteo credit"]
    end
  end

  FC --> FCC
  PR --> PRC
  ERA --> EC
  GEO -.-> GC
  LOC --> FCC & PRC & EC
  T -. types .-> FCC & PRC & EC & GC
  PRC --> AL
  EC --> AL
  AL --> BI --> BT --> ME
  FCC --> APP
  ME --> APP
  BI --> APP
  APP --> NOW & HIS & FV & TG & BD & ER & FT
```

Rules the diagram encodes:

- Components never call `fetch` or do arithmetic on weather data. They render what `src/lib` returns.
- `openMeteo.ts` and `location.ts` are shared and change only in the architect window.
- Kos is fixed. Geocoding appears only if search fits the time budget, and every result shows country and region.

## 2. Load and refresh

```mermaid
sequenceDiagram
  autonumber
  participant U as Browser tab
  participant A as App
  participant F as Forecast API
  participant P as Previous Runs API
  participant E as ERA5 archive
  participant C as src/lib/correction

  Note over U,C: Page open
  U->>A: mount (Kos)
  A->>F: current + hourly + daily, past_days=28, forecast_days=7
  F-->>A: ForecastResponse
  A->>U: render now, 4 weeks, 7 days (source only)
  par second opinion, in the background
    A->>P: hourly _previous_day1..7, last ~35 days
    P-->>A: PreviousRunsResponse
  and
    A->>E: hourly truth, same window
    E-->>A: Era5Response
  end
  A->>C: align, bias per lead day, backtest
  C-->>A: corrected series, band, verdict per variable
  A->>U: show Corrected, band and badge

  Note over U,C: Every 10 minutes (paused while the tab is hidden)
  A->>F: same Forecast request
  F-->>A: new current and forecast
  A->>C: reapply cached bias to the new forecast
  C-->>A: corrected series
  A->>U: re-render
  Note over A,E: Not refetched: Previous Runs and ERA5. They change once a day,<br/>so bias and backtest are kept until a full reload.
```

Failure paths:

- Forecast fails: the page shows `ErrorState` with the API's `reason`.
- Previous Runs or ERA5 fails: the base dashboard stays, the badge says "second opinion unavailable" with the reason, and the Corrected toggle is disabled.
- On refresh failure the last good data stays on screen with a "last updated" time.

Load per visit: 3 calls, plus 1 every 10 minutes. Well under Open-Meteo's 600 a minute and 10,000 a day.

## 3. Second opinion: correction and backtest

Variables: daily max and min temperature (°C). Others only if time allows.

```mermaid
flowchart TD
  A["Previous Runs: hourly temperature_2m_previous_dayL<br/>one locked model, L = 1..7"] --> B["Aggregate to daily max and min<br/>in Europe/Athens local time"]
  C["ERA5: hourly temperature_2m"] --> D["Aggregate to daily max and min<br/>same local-time rule"]
  B --> E["Align by local date<br/>forecast f(var, L, D) and truth t(var, D)"]
  D --> E
  E --> F["Error e = f - t<br/>per variable, lead L, date D"]
  F --> G["Bias b(var, L, D) = mean of e over the 21 days<br/>whose truth was known before the forecast for D was issued"]
  G --> H["Corrected c = f - b"]
  H --> I["Backtest over the window:<br/>MAE source vs MAE corrected, per variable and lead"]
  F --> J["80% band: 10th and 90th percentile<br/>of corrected residuals, per lead"]
  I --> K{"MAE corrected lower than MAE source<br/>and n at least 10 days?"}
  K -- yes --> L["Use correction for this variable and lead<br/>badge: 'corrected, X.X °C better over n days'"]
  K -- no --> M["Use source<br/>badge: 'source wins, no correction'"]
  L --> N["Apply to today's forecast: c = f - b, with band"]
  J --> N
```

The no-look-ahead rule: for a forecast of date D at lead L, issued on D − L, the bias may only use dates whose ERA5 truth existed on D − L (that is, dates up to about D − L − 5, because of the ERA5 lag). A test changes all future truth and checks that past corrections stay identical.

## 4. File tree

```text
src/
  main.tsx                     React entry, mounts App
  App.tsx                      holds state, runs the 10-minute refresh, wires lib to components
  index.css                    layout, desktop grid and mobile stack
  components/
    CurrentPanel.tsx           "now": temperature, feels-like, wind, humidity, with units
    HistoryChart.tsx           past 28 days: daily max/min line chart
    ForecastView.tsx           next 7 days: chart + table, source and corrected, 80% band
    SeriesToggles.tsx          on/off: Source, Corrected, 80% band
    TrackRecordBadge.tsx       verdict per variable from the backtest
    ErrorState.tsx             API reason, retry button
    Footer.tsx                 "Weather data by Open-Meteo.com" (CC BY 4.0), last updated
  lib/
    openMeteo.ts               response types, isApiError, misalignedFields (shared, architect only)
    openMeteo.test.ts          fixtures match the types and are aligned
    location.ts                Place type and the KOS default (shared, architect only)
    forecastClient.ts(+test)   builds the Forecast URL, returns ForecastResponse or ApiError
    previousRunsClient.ts(+test)  builds the Previous Runs URL for the locked model
    era5Client.ts(+test)       builds the ERA5 URL for the backtest window
    geocodingClient.ts(+test)  optional: search with countryCode, shows country and region
    correction/
      align.ts(+test)          hourly to daily in local time, joins forecast and truth by date
      bias.ts(+test)           rolling bias per variable and lead, no look-ahead
      backtest.ts(+test)       replays the window, corrected vs source per day
      metrics.ts(+test)        MAE, n, percentile band, decision rule
    fixtures/                  real Open-Meteo responses used by the tests
```

## 5. Wireframes

Desktop (≥ 900 px):

```text
+--------------------------------------------------------------------------+
| Weather Quick        Kos, South Aegean, Greece          updated 23:10    |
+---------------------------+----------------------------------------------+
| NOW                       | NEXT 7 DAYS                                  |
|  17.4 °C  feels 16.0 °C   |  [x] Source  [x] Corrected  [x] 80% band     |
|  wind 22 km/h NW          |  °C                                          |
|  humidity 71 %            |  24|   ___----___      shaded = 80% band     |
|                           |  18|--/          \---  solid = corrected      |
| SECOND OPINION            |  12|                   dashed = source        |
| [badge] Max temp:         |     Thu Fri Sat Sun Mon Tue Wed              |
|  corrected, 0.8 °C better |  day  src max  ours max  80% range  gap      |
|  over 18 days             |  Thu  21.0     20.2      19.1-21.4  -0.8     |
|  Min temp: source wins    |  ...                                         |
+---------------------------+----------------------------------------------+
| PAST 4 WEEKS                                                             |
|  °C  daily max ----  daily min ....                                      |
|  24|  /\    /\__/\                                                       |
|  12|_/  \__/      \____                                                  |
|     28 Oct ............................................. 25 Nov          |
+--------------------------------------------------------------------------+
| Weather data by Open-Meteo.com (CC BY 4.0) · ERA5 truth via Open-Meteo   |
+--------------------------------------------------------------------------+
```

Mobile (< 900 px), one column in this order:

```text
+--------------------------+
| Weather Quick            |
| Kos, South Aegean, GR    |
+--------------------------+
| NOW  17.4 °C             |
| feels 16.0 · wind 22 NW  |
+--------------------------+
| [badge] Max: corrected,  |
| 0.8 °C better (18 days)  |
+--------------------------+
| NEXT 7 DAYS              |
| [Source][Corrected][80%] |
|  chart (full width)      |
|  Thu 20.2 (19.1-21.4)    |
|  Fri ...                 |
+--------------------------+
| PAST 4 WEEKS             |
|  chart (scroll-free)     |
+--------------------------+
| Data: Open-Meteo.com     |
| CC BY 4.0 · updated 23:10|
+--------------------------+
```

## 6. Open decisions

| Decision | Options | Trade-offs | Proposal |
| --- | --- | --- | --- |
| Chart library (one only) | **Recharts** | Declarative JSX, `Area` with a `[low, high]` range draws the band, responsive container. About 100 kB gzip. | **Recharts.** Readable in a live change during the call; the band is one component. |
| | uPlot | About 15 kB, very fast. Imperative API and a React wrapper by hand; band needs a plugin or a fill between two series. | |
| | Chart.js + react-chartjs-2 | Familiar. Two dependencies, canvas, band via `fill` between datasets. | |
| How the 80% band shows | **Shaded area on the chart + range in the table** | Visible at a glance and exact in numbers. Needs a legend line. | **Shaded + table.** |
| | Whiskers per day | Precise, but busy on 7 points × 2 series. | |
| | Text only ("19–21 °C") | Simplest, no visual sense of spread. | |
| Band method | **Empirical 10th/90th percentile of residuals** | No distribution assumption; noisy with n < 15. | **Empirical**, and hide the band when n < 10. |
| | Normal, ±1.28 σ | Smooth with small n; assumes symmetric errors. | |
| Bias window | 14 / **21** / 28 days | Shorter follows regime changes, longer is steadier. 21 leaves 10+ backtest days within the Previous Runs history we fetch. | **21 days.** |
| Locked model | **best_match (default)** | Same model as the base dashboard, matches the fixtures. Blend can change under us. | **best_match**, noted as a rough edge. |
| | ecmwf_ifs025 | One fixed model, cleaner science; differs from what the base shows. | |
| Decision rule | **MAE corrected < MAE source, n ≥ 10** | Simple and honest; small wins can be noise. | **This rule.** Margin test is roadmap. |
| | Require a margin (e.g. 0.2 °C) | Fewer false wins; one more number to defend. | |
| Refresh while tab hidden | **Pause, refresh on return** | Saves calls; shows a stale time until return. | **Pause.** |
| | Keep refreshing | Always fresh; wastes calls. | |

New dependency to approve now: the chart library only. Nothing else is planned.

## 7. Tests vs eye

| Checked by tests (vitest, `src/lib` only) | Checked by eye (Petros) |
| --- | --- |
| Fixtures match the types; time arrays align with every field | Layout on desktop and on a phone width |
| Each client builds a URL with exactly the brief's fields and parameters | Charts readable: axes, units, legend, colours |
| `ApiError` is detected and its `reason` passes through | Toggles turn series and band on and off |
| `align`: local-date aggregation, midnight edge, the 25 Oct DST change | Badge wording is true and short, including "source wins" |
| No look-ahead: changing future truth leaves past corrections identical | Error state appears when the network is off |
| `bias`, `backtest`, `metrics` on small hand-made series with known answers | Footer link to Open-Meteo works |
| Percentile band and the n ≥ 10 rule | Values plausible for Kos in late November (about 13–23 °C) |
| Refresh logic refetches the forecast only (pure scheduler function) | Refresh: "updated" time changes after 10 minutes |

No component tests: they would need Testing Library and jsdom, which are new dependencies. Ask first if wanted.

## 8. PR order and time

Used so far: 0:55 logged, plus about 0:15 for this document. Left: about 4:50.

```mermaid
gantt
  dateFormat HH:mm
  axisFormat %H:%M
  title Remaining budget (hours of work, not clock time)
  section Parallel
  PR step 4 UI base (ui window)            :a, 00:00, 75m
  PR step 5 correction + backtest          :b, 00:00, 105m
  section After both merge
  PR step 6 second-opinion UI              :c, after b, 45m
  section Architect
  Step 7 notes, ai logs, Vercel, rehearsal :d, after c, 40m
  Buffer                                   :e, after d, 25m
```

| PR | Window | Branch | Estimate | Depends on |
| --- | --- | --- | --- | --- |
| Step 4: UI base | ui | `feat/ui-base` | 1:15 | this doc approved |
| Step 5: correction + backtest | correction | `feat/second-opinion` | 1:45 | this doc approved |
| Step 6: second-opinion UI | ui | `feat/second-opinion-ui` | 0:45 | 4 and 5 merged |
| Step 7: NOTES, ai/, deploy, rehearsal | architect | `claude/...` | 0:40 | 6 merged |
| Buffer | | | 0:25 | |
| **Total** | | | **4:50** | |

Billed time counts each window's work, so steps 4 and 5 add up (3:00) even though they run side by side. If step 5 runs over, cut in this order: min temperature (keep max only), then the band, then geocoding (already optional).

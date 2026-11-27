import { splitDays, todayOf, toDays, type Day } from '../lib/days'
import { joinHours, maxRainChance, nextHours, toHours, type Hour } from '../lib/hours'
import type { ForecastResponse } from '../lib/openMeteo'
import { AboutData } from './AboutData'
import type { Layers, Lines } from './layers'
import { LiveScene } from './LiveScene'
import { Next48Hours } from './Next48Hours'
import { Next7Days } from './Next7Days'
import { NowTiles } from './NowTiles'
import { Past28Days } from './Past28Days'
import { PastNumbers } from './PastNumbers'
import { TrackRecord } from './TrackRecord'
import type { SecondOpinion } from './useSecondOpinion'

interface Props {
  latest: ForecastResponse
  past: Day[]
  pastHours: Hour[]
  layers: Layers
  second: SecondOpinion
  lines: Lines
}

/** The main dashboard: the live scene, now, the next 48 hours, the next 7 days with the second opinion, the past 28. */
export function Overview({ latest, past, pastHours, layers, second, lines }: Props) {
  const c = latest.current
  const today = todayOf(c)
  const latestHours = toHours(latest.hourly)
  const allHours = joinHours(pastHours, latestHours)
  const now = Math.max(
    0,
    allHours.findIndex((h) => h.time === `${c.time.slice(0, 13)}:00`),
  )
  const next = splitDays(toDays(latest.daily), today).next
  const next48 = nextHours(latestHours, c.time)

  return (
    <>
      <LiveScene
        hours={allHours}
        now={now}
        current={c}
        days={[...past, ...next]}
        today={today}
        units={latest.hourly_units}
        dailyUnits={latest.daily_units}
        layers={layers}
      />
      <NowTiles current={c} units={latest.current_units} today={next[0]} rainChance48={maxRainChance(next48)} verdict={second.verdict} />
      <div className="row">
        <Next48Hours hours={next48} units={latest.hourly_units} layers={layers} />
        <TrackRecord />
      </div>
      <Next7Days days={next} today={today} units={latest.daily_units} second={second} lines={lines} />
      <div className="row">
        <Past28Days days={past} units={latest.daily_units} layers={layers} />
        <PastNumbers days={past} units={latest.daily_units} />
      </div>
      <AboutData meta={latest} />
    </>
  )
}

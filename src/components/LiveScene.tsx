import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { dateTimeLabel, type Day } from '../lib/days'
import { rainLevel, type Hour, type RainLevel } from '../lib/hours'
import { KOS } from '../lib/location'
import type { ForecastResponse } from '../lib/openMeteo'
import { compassPoint16 } from '../lib/weatherCode'
import { MAP, mapPoint } from './kosMap'
import type { Layers } from './layers'
import { ChartFallback } from './Swatches'

const LiveStrip = lazy(() => import('./LiveStrip'))

export type Measure = 'wind' | 'rain' | 'temp'

interface Props {
  /** Every hour we have: the past weeks, now and the next 7 days. */
  hours: Hour[]
  /** Index of the current hour in `hours`. */
  now: number
  current: ForecastResponse['current']
  /** The past days and the next 7, daily. */
  days: Day[]
  today: string
  units: ForecastResponse['hourly_units']
  dailyUnits: ForecastResponse['daily_units']
  layers: Layers
}

interface Moment {
  label: string
  temp: number
  wind: number
  windDir: number
  gust: number
  rain: number
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Land tint from air temperature: blue when cold, green when mild, orange when hot. */
function landColor(temp: number): string {
  const t = Math.min(1, Math.max(0, (temp + 5) / 40)) // -5 °C → 0, 35 °C → 1
  return `oklch(78% 0.1 ${(250 - t * 200).toFixed(0)})`
}

const RAIN_WORD: Record<RainLevel, string> = { dry: 'dry', light: 'light rain', moderate: 'moderate rain', heavy: 'heavy rain' }

/**
 * The live scene: Kos on a tilted map, wind particles running over it, rain falling as hard as the hour says,
 * land tinted by the temperature. A timeline runs from the past weeks to the next 7 days; play moves through it.
 * Below, the chosen measure day by day: the past and the forecast. Open-Meteo gives one reading for the Kos
 * grid cell, so the whole frame moves alike.
 */
export function LiveScene({ hours, now, current: c, days, today, units: u, dailyUnits, layers }: Props) {
  const [index, setIndex] = useState(now)
  const [playing, setPlaying] = useState(false)
  const [measure, setMeasure] = useState<Measure>('wind')
  const isNow = index === now
  const h = hours[index]
  const m: Moment = isNow
    ? { label: 'Now', temp: c.temperature_2m, wind: c.wind_speed_10m, windDir: c.wind_direction_10m, gust: c.wind_gusts_10m, rain: h.rain }
    : { label: dateTimeLabel(h.time), temp: h.temp, wind: h.wind, windDir: h.windDir, gust: h.gust, rain: h.rain }
  const level = rainLevel(m.rain)
  const kind = isNow ? 'Now' : index < now ? 'Past' : 'Forecast'

  // A new reading moves "now"; follow it unless the visitor has gone elsewhere.
  const lastNow = useRef(now)
  useEffect(() => {
    if (index === lastNow.current) setIndex(now)
    lastNow.current = now
  }, [now, index])

  // Play: one hour every 120 ms, from here to the last forecast hour.
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= hours.length) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, 120)
    return () => window.clearInterval(id)
  }, [playing, hours.length])

  const [kx, ky] = mapPoint(KOS.longitude, KOS.latitude)
  const reading = `${Math.round(m.wind)} ${u.wind_speed_10m} from ${compassPoint16(m.windDir)}, gusts ${Math.round(m.gust)} · ${m.rain.toFixed(1)} ${u.precipitation}/h, ${RAIN_WORD[level]} · ${m.temp.toFixed(1)} ${u.temperature_2m}`
  const pickDate = (date: string) => {
    const noon = hours.findIndex((x) => x.time === `${date}T12:00`)
    if (noon >= 0) {
      setPlaying(false)
      setIndex(noon)
    }
  }

  return (
    <section id="live" aria-labelledby="live-h" className="card live">
      <div className="card-head">
        <div>
          <h2 id="live-h">Live over Kos</h2>
          <p className="sub">The weather as it moves: wind, rain and temperature, now, in the past weeks and in the forecast.</p>
        </div>
        <p className="live-when" data-kind={kind}>
          <span className="live-kind">{kind}</span> {isNow ? dateTimeLabel(c.time) : m.label}
        </p>
      </div>

      <div className={`scene rain-${level}`} style={{ '--land': layers.temp ? landColor(m.temp) : undefined } as React.CSSProperties}>
        <div className="sky" aria-hidden="true" />
        <div className="ground">
          <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} aria-hidden="true">
            <rect width={MAP.width} height={MAP.height} className="map-sea" />
            <path d={MAP.land} className="map-land" />
            <circle cx={kx} cy={ky} r="6" className="map-town" />
            <text x={kx + 10} y={ky - 10} className="map-label">
              Kos {m.temp.toFixed(0)}°
            </text>
          </svg>
          {layers.wind && <WindParticles speed={m.wind} degrees={m.windDir} />}
        </div>
        {layers.rain && level !== 'dry' && <RainFall mmPerHour={m.rain} windSpeed={m.wind} windDegrees={m.windDir} />}
        <p className="scene-reading">{reading}</p>
      </div>

      <div className="scene-controls">
        <button
          type="button"
          className="play"
          aria-pressed={playing}
          onClick={() => {
            if (!playing && index >= hours.length - 1) setIndex(0)
            setPlaying(!playing)
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="ghost" disabled={isNow} onClick={() => (setPlaying(false), setIndex(now))}>
          Now
        </button>
        <input
          type="range"
          min={0}
          max={hours.length - 1}
          value={index}
          aria-label="Time on the live scene"
          aria-valuetext={`${kind}, ${isNow ? dateTimeLabel(c.time) : m.label}: ${reading}`}
          onChange={(e) => {
            setPlaying(false)
            setIndex(Number(e.target.value))
          }}
          style={{ '--now': `${(now / Math.max(1, hours.length - 1)) * 100}%` } as React.CSSProperties}
        />
      </div>

      <div className="measure">
        <div role="group" aria-label="Measure below" className="segs">
          {(['wind', 'rain', 'temp'] as const).map((k) => (
            <button key={k} type="button" className="seg" aria-pressed={measure === k} onClick={() => setMeasure(k)}>
              {k === 'wind' ? 'Wind' : k === 'rain' ? 'Rain' : 'Temperature'}
            </button>
          ))}
        </div>
        <p className="note">The past days and the forecast. Click a day to put the scene on its noon.</p>
      </div>
      <Suspense fallback={<ChartFallback height={150} />}>
        <LiveStrip days={days} today={today} at={h.time.slice(0, 10)} measure={measure} units={dailyUnits} onPick={pickDate} />
      </Suspense>
      <p className="note">One reading covers the whole frame: Open-Meteo gives the weather of the Kos grid cell. Coastline: Natural Earth.</p>
    </section>
  )
}

/** A canvas loop that keeps running while its inputs change (it reads a ref) and pauses off screen. */
function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, first: boolean) => void) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  useLayoutEffect(() => {
    drawRef.current = draw
  })
  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const dpr = window.devicePixelRatio || 1
    let [w, h, visible, raf, first] = [0, 0, true, 0, true]
    const resize = () => {
      w = el.width = Math.round(el.clientWidth * dpr)
      h = el.height = Math.round(el.clientHeight * dpr)
      first = true
    }
    resize()
    const sizeWatch = new ResizeObserver(resize)
    sizeWatch.observe(el)
    const viewWatch = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    viewWatch.observe(el)
    const still = reducedMotion()
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible || (still && !first)) return
      drawRef.current(ctx, w, h, dpr, first)
      first = false
    }
    raf = requestAnimationFrame(frame)
    // Under reduced motion, draw once and redraw only when the inputs change (twice a second is plenty).
    const redraw = still ? window.setInterval(() => (first = true), 500) : 0
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(redraw)
      sizeWatch.disconnect()
      viewWatch.disconnect()
    }
  }, [])
  return canvas
}

/** Wind particles on the ground, moving where the wind blows to (it comes from `degrees`), as fast as it blows. */
function WindParticles({ speed, degrees }: { speed: number; degrees: number }) {
  const particles = useRef<{ x: number; y: number; age: number; jitter: number }[]>([])
  const canvas = useCanvasLoop((ctx, w, h, dpr, first) => {
    const to = ((degrees + 180) * Math.PI) / 180
    const step = Math.max(0.15, speed * 0.06) * dpr
    const [vx, vy] = [Math.sin(to) * step, -Math.cos(to) * step]
    const count = Math.round((w * h) / (2400 * dpr * dpr))
    const spawn = () => ({ x: Math.random() * w, y: Math.random() * h, age: Math.floor(Math.random() * 90), jitter: 0.8 + Math.random() * 0.4 })
    if (first || particles.current.length !== count) particles.current = Array.from({ length: count }, spawn)
    if (reducedMotion()) {
      // Still arrows on a grid.
      ctx.clearRect(0, 0, w, h)
      const len = Math.hypot(vx, vy) || 1
      const [ux, uy] = [vx / len, vy / len]
      ctx.strokeStyle = 'rgba(20, 32, 43, 0.55)'
      ctx.lineWidth = 1.5 * dpr
      for (let x = 30 * dpr; x < w; x += 60 * dpr)
        for (let y = 30 * dpr; y < h; y += 60 * dpr) {
          const [ex, ey] = [x + ux * 14 * dpr, y + uy * 14 * dpr]
          ctx.beginPath()
          ctx.moveTo(x - ux * 14 * dpr, y - uy * 14 * dpr)
          ctx.lineTo(ex, ey)
          ctx.lineTo(ex - (ux * 6 - uy * 4) * dpr, ey - (uy * 6 + ux * 4) * dpr)
          ctx.stroke()
        }
      return
    }
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.09)'
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 1.3 * dpr
    ctx.beginPath()
    for (const p of particles.current) {
      const [nx, ny] = [p.x + vx * p.jitter, p.y + vy * p.jitter]
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(nx, ny)
      Object.assign(p, { x: nx, y: ny, age: p.age + 1 })
      if (p.age > 110 || nx < 0 || nx > w || ny < 0 || ny > h) Object.assign(p, spawn(), { age: 0 })
    }
    ctx.stroke()
  })
  return <canvas ref={canvas} className="wind-canvas" aria-hidden="true" />
}

/**
 * Rain falling over the scene: more drops and faster the more mm per hour, slanted by the wind.
 * Light rain is a few thin drops; heavy rain is a dense, fast curtain.
 */
function RainFall({ mmPerHour, windSpeed, windDegrees }: { mmPerHour: number; windSpeed: number; windDegrees: number }) {
  const drops = useRef<{ x: number; y: number; z: number }[]>([])
  const canvas = useCanvasLoop((ctx, w, h, dpr, first) => {
    const count = Math.round(Math.min(900, 40 + mmPerHour * 90) * ((w * h) / (900 * 420 * dpr * dpr)))
    const to = ((windDegrees + 180) * Math.PI) / 180
    const drift = Math.sin(to) * Math.min(1, windSpeed / 40) * 0.5 // sideways lean, east is right
    const spawn = (top: boolean) => ({ x: Math.random() * w, y: top ? -Math.random() * h * 0.3 : Math.random() * h, z: 0.4 + Math.random() * 0.6 })
    if (first || drops.current.length !== count) drops.current = Array.from({ length: count }, () => spawn(false))
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(214, 228, 242, 0.75)'
    ctx.lineCap = 'round'
    const still = reducedMotion()
    for (const d of drops.current) {
      const fall = (6 + Math.min(10, mmPerHour)) * d.z * dpr
      const len = fall * 1.6
      ctx.lineWidth = (0.6 + d.z * 0.9) * dpr
      ctx.beginPath()
      ctx.moveTo(d.x, d.y)
      ctx.lineTo(d.x - drift * len, d.y - len)
      ctx.stroke()
      if (still) continue
      d.y += fall
      d.x += drift * fall
      if (d.y > h * (0.55 + d.z * 0.45)) Object.assign(d, spawn(true))
    }
  })
  return <canvas ref={canvas} className="rain-canvas" aria-hidden="true" />
}

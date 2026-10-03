import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EVENT_ICON, Legend, MARKER_KINDS, TipBox, axisProps, gridProps, toneColor } from '../components/charts'
import { ScenarioBar, StrategyDetail, StrategyPicker } from '../components/controls'
import { Card, KpiTile, Segmented, SeriesSwatch, Term } from '../components/ui'
import * as f from '../lib/format'
import { SERIES_COLOR } from '../lib/series'
import { useApp } from '../lib/state'
import type { SimEvent, SimResult } from '../sim'
import { CASE, STRATEGY_BY_ID, simulate } from '../sim'

const SPEEDS = [
  { value: '0.5', label: '½×' },
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
  { value: '4', label: '4×' },
]

function usePlayer(horizon: number) {
  const [month, setMonth] = useState(horizon)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState('1')
  useEffect(() => {
    if (!playing) return
    if (month >= horizon) {
      setPlaying(false)
      return
    }
    const id = setTimeout(() => setMonth((m) => Math.min(horizon, m + 1)), 650 / Number(speed))
    return () => clearTimeout(id)
  }, [playing, month, horizon, speed])
  useEffect(() => {
    setMonth((m) => Math.min(m, horizon))
  }, [horizon])
  const toggle = () => {
    if (!playing && month >= horizon) setMonth(0)
    setPlaying((p) => !p)
  }
  return { month, setMonth, playing, setPlaying, toggle, speed, setSpeed }
}

export function SimulatorView() {
  const { assumptions: a, pathId, custom, t, strategyName } = useApp()
  const result = useMemo(() => simulate(pathId, a, custom), [pathId, a, custom])
  const player = usePlayer(a.horizon)
  const { month } = player
  const now = result.months[month]
  const meta = STRATEGY_BY_ID[pathId]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'BUTTON' && tag !== 'TEXTAREA') {
        e.preventDefault()
        player.toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const lostVsBest = Math.max(0, now.bestCaseUsers - now.users)

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <ScenarioBar />
          <StrategyPicker />
        </div>
      </Card>

      <Card
        title={
          <span className="inline-flex items-center gap-2">
            <SeriesSwatch color={SERIES_COLOR[pathId]} dash={meta.dash} marker={meta.marker} />
            {strategyName(pathId)}
          </span>
        }
      >
        <StrategyDetail id={pathId} />
      </Card>

      <div className="sticky top-0 z-30 -mx-4 border-b border-line bg-page/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:bg-surface sm:px-5">
        <Player player={player} horizon={a.horizon} events={result.events} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiTile
          label={t('kpi_users')}
          value={now.users}
          format={f.users}
          delta={<>{t('kpi_ny')}: {f.users(now.nyUsers)}</>}
          source="model"
          hint="People still using Nestwise this month."
        />
        <KpiTile
          label={t('kpi_cash')}
          value={now.cash}
          format={(n) => f.money(n, { compact: true })}
          tone={now.cash < 0 ? 'bad' : 'neutral'}
          source="model"
          delta={now.cash < 0 ? 'Below zero: needs new money' : `Started at ${f.money(a.startingCash, { compact: true })}`}
          hint={<>Starting cash is an assumption: 9 months × $650K <Term id="burn">burn</Term>.</>}
        />
        <KpiTile
          label={<Term id="runway">{t('kpi_runway')}</Term>}
          value={Number.isFinite(now.runway) ? now.runway : 99}
          format={(n) => (now.cash < 0 ? 'Out of cash' : Number.isFinite(now.runway) ? `${f.months(n)} mo` : 'Cash-flow +')}
          tone={now.runway < 3 ? 'bad' : 'neutral'}
          source="model"
          hint="Months of cash left at this month's net burn."
        />
        <KpiTile
          label={t('kpi_revenue')}
          value={now.cumRevenue}
          format={(n) => f.money(n, { compact: true })}
          delta={`${f.money(now.revenue, { compact: true })} this month`}
          source="model"
          hint={<><Term id="interchange">Interchange</Term> and early-pay fees ($5/user/month) plus the Nest Yield <Term id="spread">spread</Term>.</>}
        />
        <KpiTile
          label={t('kpi_lost')}
          value={lostVsBest}
          format={f.users}
          tone={lostVsBest > 1000 ? 'bad' : 'neutral'}
          source="model"
          delta={`≈ ${f.money(lostVsBest * CASE.acquisitionCost, { compact: true })} to win back at $45 each`}
          hint="Best case: Nest Yield for everyone from month 1, never unwound."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card title={t('usersOverTime')} subtitle={`Month ${month} of ${a.horizon}`}>
          <UsersChart result={result} month={month} />
        </Card>
        <Card title={t('cashOverTime')} subtitle="Below the zero line, Nestwise needs new money to keep going.">
          <CashChart result={result} month={month} />
        </Card>
      </div>

      <Card title={t('events')}>
        <EventLog events={result.events} month={month} onJump={player.setMonth} />
      </Card>
    </div>
  )
}

function Player({ player, horizon, events }: { player: ReturnType<typeof usePlayer>; horizon: number; events: SimEvent[] }) {
  const { t } = useApp()
  const marks = events.filter((e) => MARKER_KINDS.includes(e.kind))
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={player.toggle}
        className="inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white"
        aria-label={player.playing ? t('pause') : t('play')}
      >
        <span aria-hidden>{player.playing ? '❚❚' : '▶'}</span>
        {player.playing ? t('pause') : t('play')}
      </button>
      <button
        type="button"
        onClick={() => {
          player.setPlaying(false)
          player.setMonth(0)
        }}
        className="h-10 rounded-lg border border-line px-3 text-sm text-ink-2 hover:text-ink"
      >
        ⟲ {t('restart')}
      </button>
      <Segmented label={t('speed')} value={player.speed} onChange={player.setSpeed} options={SPEEDS} />
      <div className="min-w-56 flex-1">
        <div className="relative h-4" aria-hidden>
          {marks.map((e, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 text-[10px] font-bold leading-4 rtl:translate-x-1/2"
              style={{ insetInlineStart: `${(e.month / horizon) * 100}%`, color: toneColor(e.tone) }}
              title={`Month ${e.month}: ${e.label}`}
            >
              {EVENT_ICON[e.kind]}
            </span>
          ))}
        </div>
        <label className="flex items-center gap-3">
          <span className="sr-only">{t('month')}</span>
          <input
            type="range"
            min={0}
            max={horizon}
            step={1}
            value={player.month}
            onChange={(e) => {
              player.setPlaying(false)
              player.setMonth(Number(e.target.value))
            }}
          />
          <span className="tabular w-20 shrink-0 text-end text-sm font-semibold text-ink">
            {t('month')} {player.month}
          </span>
        </label>
      </div>
    </div>
  )
}

function useChartData(result: SimResult, month: number) {
  return useMemo(
    () =>
      result.months.map((m) => ({
        month: m.month,
        users: m.month <= month ? m.users : null,
        ny: m.month <= month ? m.nyUsers : null,
        best: m.bestCaseUsers,
        cash: m.month <= month ? m.cash : null,
      })),
    [result, month],
  )
}

function EventLines({ result, month }: { result: SimResult; month: number }) {
  return (
    <>
      {result.events
        .filter((e) => MARKER_KINDS.includes(e.kind) && e.month <= month)
        .map((e, i) => (
          <ReferenceLine
            key={`${e.kind}-${i}`}
            x={e.month}
            stroke={toneColor(e.tone)}
            strokeOpacity={0.6}
            label={{ value: EVENT_ICON[e.kind], position: 'insideTop', fill: toneColor(e.tone), fontSize: 12, fontWeight: 700 }}
          />
        ))}
    </>
  )
}

function UsersChart({ result, month }: { result: SimResult; month: number }) {
  const { pathId } = useApp()
  const data = useChartData(result, month)
  const color = SERIES_COLOR[pathId]
  const meta = STRATEGY_BY_ID[pathId]
  const max = Math.max(...result.months.map((m) => m.bestCaseUsers), ...result.months.map((m) => m.users))
  const uTicks = f.niceTicks(0, max, 5)
  return (
    <>
      <Legend
        items={[
          { key: 'u', label: 'Active users', swatch: <SeriesSwatch color={color} dash={meta.dash} marker={meta.marker} /> },
          { key: 'n', label: 'Of whom use Nest Yield', swatch: <span className="h-3 w-5 rounded-sm" style={{ background: color, opacity: 0.25 }} /> },
          { key: 'b', label: 'Best case', swatch: <SeriesSwatch color="var(--muted)" dash="4 3" marker="none" /> },
        ]}
      />
      <div className="h-64 sm:h-72" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="month" type="number" domain={[0, result.months.length - 1]} tickCount={7} {...axisProps} />
            <YAxis domain={[0, uTicks[uTicks.length - 1]]} ticks={uTicks} tickFormatter={(v) => `${Math.round(v / 1000)}K`} width={40} {...axisProps} />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TipBox
                    title={`Month ${label}`}
                    rows={[
                      { label: 'Active users', value: payload[0].payload.users == null ? '—' : f.users(payload[0].payload.users) },
                      { label: 'Nest Yield', value: payload[0].payload.ny == null ? '—' : f.users(payload[0].payload.ny) },
                      { label: 'Best case', value: f.users(payload[0].payload.best) },
                    ]}
                  />
                ) : null
              }
            />
            <EventLines result={result} month={month} />
            <Line dataKey="best" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            <Area dataKey="ny" fill={color} fillOpacity={0.18} stroke="none" isAnimationActive={false} connectNulls={false} />
            <Line
              dataKey="users"
              stroke={color}
              strokeWidth={2.5}
              strokeDasharray={meta.dash === '0' ? undefined : meta.dash}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceLine x={month} stroke="var(--ink-2)" strokeWidth={1} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

function CashChart({ result, month }: { result: SimResult; month: number }) {
  const { pathId } = useApp()
  const data = useChartData(result, month)
  const color = SERIES_COLOR[pathId]
  const meta = STRATEGY_BY_ID[pathId]
  const values = result.months.map((m) => m.cash)
  const lo = Math.min(0, ...values)
  const hi = Math.max(...values)
  const cTicks = f.niceTicks(lo, hi, 5)
  return (
    <>
      <Legend items={[{ key: 'c', label: 'Cash', swatch: <SeriesSwatch color={color} dash={meta.dash} marker={meta.marker} /> }]} />
      <div className="h-64 sm:h-72" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="month" type="number" domain={[0, result.months.length - 1]} tickCount={7} {...axisProps} />
            <YAxis
              domain={[cTicks[0], cTicks[cTicks.length - 1]]}
              ticks={cTicks}
              tickFormatter={(v) => f.money(v, { compact: true })}
              width={52}
              {...axisProps}
            />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TipBox
                    title={`Month ${label}`}
                    rows={[{ label: 'Cash', value: payload[0].payload.cash == null ? '—' : f.money(payload[0].payload.cash) }]}
                  />
                ) : null
              }
            />
            <ReferenceLine y={0} stroke="var(--critical)" strokeWidth={1.5} label={{ value: 'Out of cash', position: 'insideBottomLeft', fill: 'var(--critical-ink)', fontSize: 11 }} />
            <EventLines result={result} month={month} />
            <Line
              dataKey="cash"
              stroke={color}
              strokeWidth={2.5}
              strokeDasharray={meta.dash === '0' ? undefined : meta.dash}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceLine x={month} stroke="var(--ink-2)" strokeWidth={1} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

function EventLog({ events, month, onJump }: { events: SimEvent[]; month: number; onJump: (m: number) => void }) {
  const { t, reduceMotion } = useApp()
  const shown = events.filter((e) => e.month <= month)
  if (shown.length === 0) return <p className="text-sm text-muted">{t('noEvents')}</p>
  return (
    <ol className="space-y-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {shown.map((e, i) => (
          <motion.li
            key={`${e.month}-${e.kind}-${i}`}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            <button
              type="button"
              onClick={() => onJump(e.month)}
              className="tabular w-16 shrink-0 rounded-md bg-surface-2 px-2 py-1 text-center text-xs font-semibold text-ink-2 hover:text-ink"
              title="Jump to this month"
            >
              {t('month')} {e.month}
            </button>
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: toneColor(e.tone) }}
            >
              {EVENT_ICON[e.kind]}
            </span>
            <span className="min-w-0 text-sm">
              <span className="font-semibold text-ink">{e.label}</span>
              <span className="sr-only"> ({e.tone === 'bad' ? 'bad news' : e.tone === 'good' ? 'good news' : 'note'})</span>
              <span className="block text-ink-2">{e.detail}</span>
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  )
}

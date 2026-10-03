import { useEffect, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Legend, TipBox, axisProps, gridProps } from '../components/charts'
import { ScenarioBar } from '../components/controls'
import { Card, SeriesSwatch, SourceTag, Switch, Term } from '../components/ui'
import * as f from '../lib/format'
import { SERIES_COLOR } from '../lib/series'
import { useApp } from '../lib/state'
import type { FanPoint, MonteCarloResult, PathId, Spread } from '../sim'
import { NAMED_PATHS, STRATEGY_BY_ID, monteCarlo } from '../sim'

const RUNS = 1000

export function UncertaintyView() {
  const { assumptions: a, custom, pathId, setPathId, strategyName, setAssumption } = useApp()
  const ids: PathId[] = pathId === 'custom' ? [...NAMED_PATHS, 'custom'] : NAMED_PATHS
  const [results, setResults] = useState<Record<string, MonteCarloResult> | null>(null)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    setRunning(true)
    // Let the "running" state paint before the (synchronous) runs.
    const id = setTimeout(() => {
      const out: Record<string, MonteCarloResult> = {}
      for (const p of ids) out[p] = monteCarlo(p, a, RUNS, 2026, custom)
      setResults(out)
      setRunning(false)
    }, 30)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, custom, pathId === 'custom'])

  const focus = results?.[pathId] ?? results?.mine

  return (
    <div className="space-y-4">
      <Card>
        <ScenarioBar />
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-2">
          <Switch
            checked={a.fundingEnabled}
            onChange={(v) => setAssumption('fundingEnabled', v)}
            label={<>Include a funding round ({f.money(a.fundingAmount, { compact: true })} in month {a.fundingMonth}) <SourceTag source="assumption" /></>}
          />
          <span aria-live="polite" className="text-xs text-muted">
            {running ? 'Running simulations…' : `${RUNS.toLocaleString()} seeded runs per strategy.`}
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-2">
          A <Term id="montecarlo">Monte Carlo</Term> run draws the uncertain inputs at random, many times: whether the rules allow rewards
          ({f.pct(a.pRulesFavorable)}), the rules month (4–9), sandbox approval ({f.pct(a.pSandboxApproved)}) and withdrawal (
          {f.pct(a.pSandboxWithdrawn)}), each path&apos;s launch month within its range, a chance Cardinal&apos;s{' '}
          <Term id="nonobjection">non-objection</Term> slips 4 months, and participation (75–100% of the input). Run <em>i</em> sees the same
          random world for every strategy, so differences come from the strategy, not the luck of the draw.
        </p>
      </Card>

      <Card title="Chance of survival and of an unwind" subtitle="Share of the 1,000 runs. Click a strategy to focus the fan charts.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ids.map((id) => {
            const r = results?.[id]
            const m = STRATEGY_BY_ID[id]
            return (
              <button
                type="button"
                key={id}
                onClick={() => setPathId(id)}
                aria-pressed={id === pathId}
                className={`rounded-xl border p-3 text-start transition-opacity ${id === pathId ? 'border-accent bg-accent-wash' : 'border-line bg-surface hover:bg-surface-2'} ${running ? 'opacity-60' : ''}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <SeriesSwatch color={SERIES_COLOR[id]} dash={m.dash} marker={m.marker} />
                  {strategyName(id)}
                </span>
                {r && (
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <Prob label="Cash left at month 12" p={1 - r.pOutOfCashBy12} good />
                    <Prob label="Cash left at month 24" p={1 - r.pOutOfCash} good />
                    <Prob label="Product unwound" p={r.pUnwind} />
                    <Prob label="Reaches every user" p={r.pFullLaunch} good />
                    <div className="flex justify-between gap-2 pt-1 text-xs text-ink-2">
                      <dt>Median cash-out</dt>
                      <dd className="tabular font-medium text-ink">{r.medianOutOfCashMonth === null ? 'survives' : `month ${Math.round(r.medianOutOfCashMonth)}`}</dd>
                    </div>
                  </dl>
                )}
              </button>
            )
          })}
        </div>
        {results && Object.values(results).every((r) => r.pOutOfCash > 0.99) && (
          <p className="mt-3 text-sm text-ink-2">
            <strong className="text-ink">Every path runs out of cash</strong> within 24 months without new money. Turn on the funding round
            above (or raise its size in Inputs) to see which strategy survives more often.
          </p>
        )}
      </Card>

      {focus && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={`Active users — ${strategyName(focus.pathId)}`} subtitle="Shaded bands: middle 50% and middle 80% of runs. Line: median.">
            <FanChart fan={focus.usersFan} color={SERIES_COLOR[focus.pathId]} kind="users" />
          </Card>
          <Card title={`Cash — ${strategyName(focus.pathId)}`} subtitle="Shaded bands: middle 50% and middle 80% of runs. Line: median.">
            <FanChart fan={focus.cashFan} color={SERIES_COLOR[focus.pathId]} kind="cash" />
          </Card>
        </div>
      )}

      {results && (
        <Card title="Outcome ranges" subtitle="Median, with the 10th–90th percentile range and the full min–max range.">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="tabular w-full min-w-[820px] whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-2">
                  <th className="py-2 pe-3 text-start font-medium">Strategy</th>
                  <th className="px-2 py-2 text-end font-medium">Users m12</th>
                  <th className="px-2 py-2 text-end font-medium">Users m24</th>
                  <th className="px-2 py-2 text-end font-medium">Cash m12</th>
                  <th className="px-2 py-2 text-end font-medium">Cash m24</th>
                </tr>
              </thead>
              <tbody>
                {ids.map((id) => {
                  const r = results[id]
                  const m = STRATEGY_BY_ID[id]
                  return (
                    <tr key={id} className="border-b border-line align-top">
                      <td className="py-2 pe-3">
                        <span className="inline-flex items-center gap-2 font-medium text-ink">
                          <SeriesSwatch color={SERIES_COLOR[id]} dash={m.dash} marker={m.marker} />
                          {strategyName(id)}
                        </span>
                      </td>
                      <RangeCell s={r.users12} fmt={f.users} />
                      <RangeCell s={r.users24} fmt={f.users} />
                      <RangeCell s={r.cash12} fmt={(v) => f.money(v, { compact: true })} />
                      <RangeCell s={r.cash24} fmt={(v) => f.money(v, { compact: true })} />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function Prob({ label, p, good = false }: { label: string; p: number; good?: boolean }) {
  const tone = good ? (p >= 0.7 ? 'good' : p < 0.3 ? 'bad' : 'mid') : p > 0.3 ? 'bad' : p < 0.1 ? 'good' : 'mid'
  return (
    <div>
      <div className="flex justify-between gap-2 text-xs text-ink-2">
        <dt>{label}</dt>
        <dd className="tabular font-semibold text-ink">{f.pct(p)}</dd>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(p * 100, p > 0 ? 2 : 0)}%`,
            background: tone === 'good' ? 'var(--good)' : tone === 'bad' ? 'var(--critical)' : 'var(--muted)',
          }}
        />
      </div>
    </div>
  )
}

function RangeCell({ s, fmt }: { s: Spread; fmt: (v: number) => string }) {
  return (
    <td className="px-2 py-2 text-end">
      <div className="font-semibold text-ink">{fmt(s.p50)}</div>
      <div className="text-xs text-ink-2">
        {fmt(s.p10)} – {fmt(s.p90)}
      </div>
      <div className="text-xs text-muted">
        min {fmt(s.min)} · max {fmt(s.max)}
      </div>
    </td>
  )
}

function FanChart({ fan, color, kind }: { fan: FanPoint[]; color: string; kind: 'users' | 'cash' }) {
  const data = fan.map((p) => ({ ...p, outer: [p.p10, p.p90], inner: [p.p25, p.p75] }))
  const lo = Math.min(...fan.map((p) => p.p10))
  const hi = Math.max(...fan.map((p) => p.p90))
  const ticks = f.niceTicks(kind === 'users' ? 0 : Math.min(0, lo), hi, 5)
  const fmt = kind === 'users' ? (v: number) => `${Math.round(v / 1000)}K` : (v: number) => f.money(v, { compact: true })
  const full = kind === 'users' ? f.users : (v: number) => f.money(v, { compact: true })
  return (
    <>
      <Legend
        items={[
          { key: 'm', label: 'Median', swatch: <span className="h-0.5 w-5" style={{ background: color }} /> },
          { key: 'i', label: 'Middle 50%', swatch: <span className="h-3 w-5 rounded-sm" style={{ background: color, opacity: 0.35 }} /> },
          { key: 'o', label: 'Middle 80%', swatch: <span className="h-3 w-5 rounded-sm" style={{ background: color, opacity: 0.15 }} /> },
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="month" type="number" domain={[0, fan.length - 1]} tickCount={7} {...axisProps} />
            <YAxis domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks} tickFormatter={fmt} width={52} {...axisProps} />
            {kind === 'cash' && <ReferenceLine y={0} stroke="var(--critical)" strokeWidth={1.5} />}
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TipBox
                    title={`Month ${label}`}
                    rows={[
                      { label: '90th percentile', value: full(payload[0].payload.p90) },
                      { label: '75th', value: full(payload[0].payload.p75) },
                      { label: 'Median', value: full(payload[0].payload.p50) },
                      { label: '25th', value: full(payload[0].payload.p25) },
                      { label: '10th percentile', value: full(payload[0].payload.p10) },
                    ]}
                  />
                ) : null
              }
            />
            <Area dataKey="outer" stroke="none" fill={color} fillOpacity={0.15} isAnimationActive={false} />
            <Area dataKey="inner" stroke="none" fill={color} fillOpacity={0.3} isAnimationActive={false} />
            <Line dataKey="p50" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

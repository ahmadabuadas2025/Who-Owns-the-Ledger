import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Legend, TipBox, axisProps, gridProps } from '../components/charts'
import { ScenarioBar } from '../components/controls'
import { Badge, Card, MarkerShape, Segmented, SeriesSwatch, SourceTag, Term } from '../components/ui'
import * as f from '../lib/format'
import { SERIES_COLOR } from '../lib/series'
import { useApp } from '../lib/state'
import type { PathId, SimResult } from '../sim'
import { CASE, NAMED_PATHS, STRATEGY_BY_ID, costOfDelayPerMonth, simulate } from '../sim'

const ALL: PathId[] = [...NAMED_PATHS, 'custom']

export function CompareView() {
  const { assumptions: a, custom, pathId, setPathId, strategyName, t } = useApp()
  const [visible, setVisible] = useState<PathId[]>(NAMED_PATHS)
  const [mode, setMode] = useState<'abs' | 'diff'>('abs')
  const results = useMemo(() => Object.fromEntries(ALL.map((id) => [id, simulate(id, a, custom)])) as Record<PathId, SimResult>, [a, custom])
  const shown = ALL.filter((id) => visible.includes(id))
  const highlight = shown.includes(pathId) ? pathId : null
  const delay = costOfDelayPerMonth(a.startingUsers)

  const toggle = (id: PathId) => setVisible((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

  return (
    <div className="space-y-4">
      <Card>
        <ScenarioBar />
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">Show strategies</h2>
          <div className="flex flex-wrap gap-2">
            {ALL.map((id) => {
              const m = STRATEGY_BY_ID[id]
              const on = visible.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    on ? 'border-axis bg-surface text-ink' : 'border-line bg-surface-2 text-muted line-through'
                  }`}
                >
                  <SeriesSwatch color={on ? SERIES_COLOR[id] : 'var(--axis)'} dash={m.dash} marker={m.marker} />
                  {strategyName(id)}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted">The strategy picked in the Simulator ({strategyName(pathId)}) is drawn thicker and labelled. Click a row in the table to pick another.</p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Chart scale"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'abs', label: 'Actual values' },
            { value: 'diff', label: `Difference vs ${strategyName('wait')}` },
          ]}
        />
        <p className="text-xs text-muted">
          {mode === 'abs'
            ? 'Cash lines nearly overlap: the $650K burn dwarfs the differences between paths. Switch to "difference" to see them.'
            : 'Each line shows how far ahead (+) or behind (−) of Path 1 the strategy is.'}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('usersOverTime')} subtitle={mode === 'abs' ? 'All strategies, same inputs.' : 'Users ahead of / behind Path 1.'}>
          <MultiChart results={results} ids={shown} highlight={highlight} field="users" relative={mode === 'diff'} />
        </Card>
        <Card title={t('cashOverTime')} subtitle={mode === 'abs' ? 'Below zero means Nestwise needs new money.' : 'Cash ahead of / behind Path 1.'}>
          <MultiChart results={results} ids={shown} highlight={highlight} field="cash" relative={mode === 'diff'} />
        </Card>
      </div>
      <p className="rounded-xl border border-line bg-surface p-3 text-sm text-ink-2">
        <strong className="text-ink">Reading the result:</strong> without new money every path runs out of cash around month 9 — that is the
        case&apos;s 9-month <Term id="runway">runway</Term>. The paths differ mainly in how many users are still there when Nestwise raises
        its next round, and in how many users an <Term id="unwind">unwind</Term> would hit. Try the &ldquo;Rules land differently&rdquo; scenario.
      </p>

      <Card title={t('results')} subtitle="Click a row to make it the active strategy.">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="tabular w-full min-w-[860px] whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs text-ink-2">
                <th className="py-2 pe-3 text-start font-medium">Strategy</th>
                <th className="px-2 py-2 text-end font-medium">Pilot</th>
                <th className="px-2 py-2 text-end font-medium">Everyone</th>
                <th className="px-2 py-2 text-end font-medium">Users m12</th>
                <th className="px-2 py-2 text-end font-medium">Users m24</th>
                <th className="px-2 py-2 text-end font-medium">Cash m12</th>
                <th className="px-2 py-2 text-end font-medium">Out of cash</th>
                <th className="px-2 py-2 text-end font-medium">Revenue (24 mo)</th>
                <th className="px-2 py-2 text-end font-medium">Lost vs best (m12)</th>
                <th className="ps-2 py-2 text-start font-medium">Unwind?</th>
              </tr>
            </thead>
            <tbody>
              {ALL.map((id) => {
                const r = results[id]
                const s = r.summary
                const m = STRATEGY_BY_ID[id]
                const lost = r.months[12].bestCaseUsers - r.months[12].users
                return (
                  <tr
                    key={id}
                    onClick={() => setPathId(id)}
                    className={`cursor-pointer border-b border-line hover:bg-surface-2 ${id === pathId ? 'bg-accent-wash' : ''}`}
                  >
                    <td className="py-2 pe-3">
                      <span className="inline-flex items-center gap-2 font-medium text-ink">
                        <SeriesSwatch color={SERIES_COLOR[id]} dash={m.dash} marker={m.marker} />
                        {strategyName(id)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-end text-ink-2">{s.pilotMonth ? `m${s.pilotMonth}` : '—'}</td>
                    <td className="px-2 py-2 text-end text-ink-2">{s.launchMonth ? `m${s.launchMonth}` : 'never'}</td>
                    <td className="px-2 py-2 text-end text-ink">{f.users(s.usersAt12)}</td>
                    <td className="px-2 py-2 text-end text-ink">{f.users(s.usersAt24)}</td>
                    <td className="px-2 py-2 text-end text-ink">{f.money(s.cashAt12, { compact: true })}</td>
                    <td className="px-2 py-2 text-end text-ink">{s.outOfCashMonth ? `month ${s.outOfCashMonth}` : 'no'}</td>
                    <td className="px-2 py-2 text-end text-ink">{f.money(s.totalRevenue, { compact: true })}</td>
                    <td className="px-2 py-2 text-end text-ink">{f.users(Math.max(0, lost))}</td>
                    <td className="ps-2 py-2">{s.unwound ? <Badge tone="bad">Yes</Badge> : <Badge tone="good">No</Badge>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Why timing matters" subtitle="The case's arithmetic for one month of delay.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Fact value={f.users(delay.extraUsersLost)} label="extra users lost each month without Nest Yield" note={`${f.users(a.startingUsers)} × (4.0% − 2.5%)`} />
          <Fact value={f.money(delay.replacementCost)} label="to win them back" note={<>at ${CASE.acquisitionCost} <Term id="cac">acquisition cost</Term> each</>} />
          <Fact value={f.money(delay.lifetimeRevenue)} label="of lifetime revenue walks out" note={<>at $200 <Term id="ltv">lifetime value</Term> each</>} />
        </div>
      </Card>
    </div>
  )
}

function Fact({ value, label, note }: { value: string; label: string; note: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl font-semibold text-ink">{value}</span>
        <SourceTag source="case" />
      </div>
      <div className="text-sm text-ink-2">{label}</div>
      <div className="mt-1 text-xs text-muted">{note}</div>
    </div>
  )
}

function MultiChart({
  results,
  ids,
  highlight,
  field,
  relative = false,
}: {
  results: Record<PathId, SimResult>
  ids: PathId[]
  highlight: PathId | null
  field: 'users' | 'cash'
  relative?: boolean
}) {
  const { strategyName } = useApp()
  const H = results.wait.months.length - 1
  const data = useMemo(
    () =>
      Array.from({ length: H + 1 }, (_, m) => {
        const row: Record<string, number> = { month: m }
        for (const id of ids) row[id] = results[id].months[m][field] - (relative ? results.wait.months[m][field] : 0)
        return row
      }),
    [results, ids, field, H, relative],
  )
  const vals = data.flatMap((r) => ids.map((id) => r[id]))
  const ticks = f.niceTicks(field === 'users' && !relative ? 0 : Math.min(0, ...vals), Math.max(...vals, 1), 5)
  const sign = (v: number) => (relative && v > 0 ? '+' : '')
  const fmt =
    field === 'users'
      ? (v: number) => (relative ? `${sign(v)}${f.users(v)}` : `${Math.round(v / 1000)}K`)
      : (v: number) => `${sign(v)}${f.money(v, { compact: true })}`
  const full = field === 'users' ? (v: number) => `${sign(v)}${f.users(v)}` : (v: number) => `${sign(v)}${f.money(v, { compact: true })}`
  const endLabelId = highlight

  return (
    <>
      <Legend
        items={ids.map((id) => ({
          key: id,
          label: strategyName(id),
          swatch: <SeriesSwatch color={SERIES_COLOR[id]} dash={STRATEGY_BY_ID[id].dash} marker={STRATEGY_BY_ID[id].marker} />,
        }))}
      />
      <div className="h-72" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: endLabelId ? 96 : 12, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="month" type="number" domain={[0, H]} tickCount={7} {...axisProps} />
            <YAxis domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks} tickFormatter={fmt} width={relative ? 60 : field === 'users' ? 40 : 52} {...axisProps} />
            {field === 'cash' && !relative && <ReferenceLine y={0} stroke="var(--critical)" strokeWidth={1.5} />}
            {relative && <ReferenceLine y={0} stroke="var(--axis)" strokeWidth={1.5} />}
            <Tooltip
              cursor={{ stroke: 'var(--axis)' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TipBox
                    title={`Month ${label}`}
                    rows={[...payload]
                      .sort((x, y) => Number(y.value) - Number(x.value))
                      .map((p) => {
                        const id = p.dataKey as PathId
                        return {
                          label: strategyName(id),
                          value: full(Number(p.value)),
                          swatch: <SeriesSwatch color={SERIES_COLOR[id]} dash={STRATEGY_BY_ID[id].dash} marker={STRATEGY_BY_ID[id].marker} />,
                        }
                      })}
                  />
                ) : null
              }
            />
            {ids.map((id) => {
              const m = STRATEGY_BY_ID[id]
              const isHi = id === highlight
              return (
                <Line
                  key={id}
                  dataKey={id}
                  stroke={SERIES_COLOR[id]}
                  strokeWidth={isHi ? 3 : 1.75}
                  strokeOpacity={highlight && !isHi ? 0.75 : 1}
                  strokeDasharray={m.dash === '0' ? undefined : m.dash}
                  isAnimationActive={false}
                  dot={(props: { cx?: number; cy?: number; index?: number }) =>
                    props.index !== undefined && props.index % 6 === 0 && props.index > 0 && props.cx != null && props.cy != null ? (
                      <MarkerShape key={`${id}-${props.index}`} shape={m.marker} x={props.cx} y={props.cy} r={4} color={SERIES_COLOR[id]} />
                    ) : (
                      <g key={`${id}-${props.index}`} />
                    )
                  }
                  activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }}
                  label={
                    isHi
                      ? (p: { index?: number; x?: number | string; y?: number | string }) =>
                          p.index === H ? (
                            <text key="end" x={Number(p.x) + 8} y={Number(p.y) + 4} fontSize={12} fontWeight={600} fill="var(--ink)">
                              {strategyName(id)}
                            </text>
                          ) : null
                      : undefined
                  }
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ScenarioBar, StrategyPicker } from '../components/controls'
import { Card } from '../components/ui'
import * as f from '../lib/format'
import { useApp } from '../lib/state'
import type { Metric } from '../sim'
import { METRICS, tornado } from '../sim'

export function SensitivityView() {
  const { assumptions: a, custom, pathId, strategyName } = useApp()
  const [metric, setMetric] = useState<Metric>('users24')
  const bars = useMemo(() => tornado(pathId, a, metric, custom), [pathId, a, metric, custom])
  const unit = METRICS.find((m) => m.id === metric)!.unit
  const fmt = unit === 'users' ? f.users : (v: number) => f.money(v, { compact: true })
  const base = bars[0]?.base ?? 0
  const lo = Math.min(base, ...bars.flatMap((b) => [b.low, b.high]))
  const hi = Math.max(base, ...bars.flatMap((b) => [b.low, b.high]))
  const span = hi - lo || 1
  const pos = (v: number) => ((v - lo) / span) * 100

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <ScenarioBar />
          <StrategyPicker />
          <label className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
            Outcome to explain:
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
              className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
            >
              {METRICS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card
        title={`What moves "${METRICS.find((m) => m.id === metric)!.label.toLowerCase()}" most — ${strategyName(pathId)}`}
        subtitle={`Each input is moved to a low and a high value while everything else stays put. Longest bar = biggest effect. Starting point: ${fmt(base)}.`}
      >
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm" style={{ background: 'var(--s-wait)' }} /> Input at its low value
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm" style={{ background: 'var(--s-mine)' }} /> Input at its high value
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3 w-0.5" style={{ background: 'var(--ink)' }} /> Current inputs
          </li>
        </ul>
        <ol className="space-y-3">
          {bars.map((b, i) => (
            <li key={b.key} className="grid gap-1 sm:grid-cols-[12rem_1fr] sm:items-center sm:gap-3">
              <div className="text-sm">
                <span className="font-medium text-ink">
                  {i + 1}. {b.label}
                </span>
                <span className="block text-xs text-muted">
                  {b.lowLabel} → {b.highLabel} · swing {fmt(b.swing)}
                </span>
              </div>
              <div className="relative h-8" role="img" aria-label={`${b.label}: low ${b.lowLabel} gives ${fmt(b.low)}, high ${b.highLabel} gives ${fmt(b.high)}`}>
                <div className="absolute inset-y-3.5 start-0 end-0 rounded bg-surface-2" />
                <Seg from={base} to={b.low} pos={pos} color="var(--s-wait)" />
                <Seg from={base} to={b.high} pos={pos} color="var(--s-mine)" />
                <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ insetInlineStart: `${pos(base)}%` }} />
                {b.swing > 0 && (
                  <>
                    <EndLabel v={b.low} pos={pos} text={fmt(b.low)} />
                    {Math.abs(pos(b.high) - pos(b.low)) > 14 && <EndLabel v={b.high} pos={pos} text={fmt(b.high)} />}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

function Seg({ from, to, pos, color }: { from: number; to: number; pos: (v: number) => number; color: string }) {
  const s = Math.min(pos(from), pos(to))
  const w = Math.abs(pos(to) - pos(from))
  return (
    <motion.div
      className="absolute inset-y-1.5 rounded-sm"
      style={{ background: color }}
      initial={false}
      animate={{ insetInlineStart: `${s}%`, width: `${Math.max(w, w > 0 ? 0.4 : 0)}%` }}
      transition={{ duration: 0.35 }}
    />
  )
}

function EndLabel({ v, pos, text }: { v: number; pos: (v: number) => number; text: string }) {
  const p = pos(v)
  const right = p > 70
  return (
    <span
      className="tabular pointer-events-none absolute -top-3 whitespace-nowrap text-[11px] text-ink-2"
      style={right ? { insetInlineEnd: `${100 - p}%` } : { insetInlineStart: `${p}%` }}
    >
      {text}
    </span>
  )
}

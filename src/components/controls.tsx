import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { SERIES_COLOR } from '../lib/series'
import { useApp } from '../lib/state'
import * as f from '../lib/format'
import type { AssumptionMeta, Assumptions, PathId } from '../sim'
import { ASSUMPTION_META, CASE, DEFAULT_ASSUMPTIONS, SCENARIOS, STRATEGIES } from '../sim'
import { SeriesSwatch, SourceTag, Switch } from './ui'

export function StrategyPicker({ includeCustom = true }: { includeCustom?: boolean }) {
  const { pathId, setPathId, strategyName, t, learnMode } = useApp()
  const list = STRATEGIES.filter((s) => includeCustom || s.id !== 'custom')
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">{t('strategy')}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {list.map((s) => {
          const active = s.id === pathId
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => setPathId(s.id)}
              className={`relative flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition-colors ${
                active ? 'border-accent bg-accent-wash' : 'border-line bg-surface hover:bg-surface-2'
              }`}
            >
              <span className="flex w-full items-center justify-between gap-1">
                <span className="text-xs font-semibold text-muted">
                  {s.id === 'custom' ? '' : s.id === 'mine' ? '★' : `Path ${s.number}`}
                </span>
                <SeriesSwatch color={SERIES_COLOR[s.id]} dash={s.dash} marker={s.marker} />
              </span>
              <span className="text-sm font-semibold leading-tight text-ink">{strategyName(s.id)}</span>
              {learnMode && <span className="text-xs leading-snug text-ink-2">{s.timing}</span>}
              {active && <span className="sr-only">(selected)</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function StrategyDetail({ id }: { id: PathId }) {
  const s = STRATEGIES.find((x) => x.id === id)!
  if (id === 'custom') return <CustomBuilder />
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-[2fr_1fr_1fr]">
      <p className="text-ink-2">{s.summary}</p>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Up-front · time</div>
        <div className="text-ink">{s.upfront}</div>
        <div className="text-ink-2">{s.timing}</div>
      </div>
      <div className="space-y-1">
        <div className="flex gap-1.5 text-ink"><span aria-hidden className="text-good-ink">+</span><span><span className="sr-only">Good: </span>{s.good}</span></div>
        <div className="flex gap-1.5 text-ink"><span aria-hidden className="text-critical-ink">−</span><span><span className="sr-only">Bad: </span>{s.bad}</span></div>
      </div>
      {id === 'mine' && (
        <ol className="list-decimal space-y-1 ps-5 text-ink-2 sm:col-span-3">
          <li><strong className="text-ink">Now:</strong> relaunch deposits with Cardinal as the ledger of record and ClearTally as the nightly independent check.</li>
          <li><strong className="text-ink">Months 4–6:</strong> sandbox pilot of Nest Yield with 2,000 users.</li>
          <li><strong className="text-ink">When final rules land and the issuer is approved:</strong> open Nest Yield to everyone.</li>
          <li className="list-none text-xs text-muted">Business reason: an unwind hits 2,000 users, not 21,000, and the pilot gives real retention data for the next round. Regulatory reason: Cardinal cannot sign without non-objection, so a regulator-first plan is the most likely to be approved.</li>
        </ol>
      )}
    </div>
  )
}

function NumberRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display: string
}) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between gap-2 text-ink-2">
        <span>{label}</span>
        <span className="tabular font-medium text-ink">{display}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

export function CustomBuilder() {
  const { custom, setCustom, t } = useApp()
  const set = <K extends keyof typeof custom>(k: K, v: (typeof custom)[K]) => setCustom({ ...custom, [k]: v })
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">{t('customBuilder')}</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 rounded-lg bg-surface-2 p-3">
          <Switch checked={custom.pilotEnabled} onChange={(v) => set('pilotEnabled', v)} label="Run a sandbox pilot" />
          {custom.pilotEnabled && (
            <>
              <NumberRow label="Pilot starts" value={custom.pilotMonth} min={1} max={12} step={1} onChange={(v) => set('pilotMonth', v)} display={`month ${custom.pilotMonth}`} />
              <NumberRow label="Pilot size (max users)" value={custom.pilotCap} min={500} max={21_000} step={500} onChange={(v) => set('pilotCap', v)} display={f.users(custom.pilotCap)} />
              <p className="text-xs text-muted">Needs sandbox approval; exposed to withdrawal and to unfavourable rules.</p>
            </>
          )}
        </div>
        <div className="space-y-2 rounded-lg bg-surface-2 p-3">
          <Switch checked={custom.fullEnabled} onChange={(v) => set('fullEnabled', v)} label="Launch to everyone" />
          {custom.fullEnabled && (
            <>
              <div role="radiogroup" aria-label="Launch trigger" className="flex flex-col gap-1 text-sm text-ink-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={custom.fullTrigger === 'rules'} onChange={() => set('fullTrigger', 'rules')} />
                  When final rules land
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={custom.fullTrigger === 'month'} onChange={() => set('fullTrigger', 'month')} />
                  At a fixed month (before rules)
                </label>
              </div>
              <NumberRow
                label={custom.fullTrigger === 'rules' ? 'Not before' : 'Launch month'}
                value={custom.fullMonth}
                min={custom.fullTrigger === 'rules' ? 0 : 1}
                max={18}
                step={1}
                onChange={(v) => set('fullMonth', v)}
                display={`month ${custom.fullMonth}`}
              />
            </>
          )}
        </div>
        <div className="space-y-2 rounded-lg bg-surface-2 p-3">
          <NumberRow label="Up-front cost" value={custom.cost} min={0} max={800_000} step={10_000} onChange={(v) => set('cost', v)} display={f.money(custom.cost, { compact: true })} />
          <p className="text-xs text-muted">Every launch still waits for Cardinal&apos;s non-objection. Participation comes from the global inputs.</p>
        </div>
      </div>
    </div>
  )
}

export function ScenarioBar() {
  const { scenarioId, applyScenario, t, assumptions } = useApp()
  const modified = scenarioId === null && JSON.stringify(assumptions) !== JSON.stringify(DEFAULT_ASSUMPTIONS)
  const active = SCENARIOS.find((s) => s.id === scenarioId)
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-sm font-semibold text-ink">{t('scenario')}</h2>
        {modified && <span className="text-xs text-muted">(custom inputs in use)</span>}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label={t('scenario')}>
        <ScenarioChip active={scenarioId === null && !modified} onClick={() => applyScenario(null)}>
          {t('baseCase')}
        </ScenarioChip>
        {SCENARIOS.map((s) => (
          <ScenarioChip key={s.id} active={scenarioId === s.id} onClick={() => applyScenario(s.id)} title={s.description}>
            {s.name}
          </ScenarioChip>
        ))}
      </div>
      {active && <p className="mt-1 text-xs text-ink-2">{active.description}</p>}
    </div>
  )
}

function ScenarioChip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      title={title}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? 'border-accent bg-accent text-white' : 'border-line bg-surface text-ink-2 hover:text-ink'
      }`}
    >
      {active && <span aria-hidden>✓ </span>}
      {children}
    </button>
  )
}

const GROUPS: { id: AssumptionMeta['group']; label: string }[] = [
  { id: 'business', label: 'Business' },
  { id: 'timing', label: 'Timing' },
  { id: 'regulation', label: 'Regulators & rules' },
  { id: 'unwind', label: 'If the product is unwound' },
  { id: 'costs', label: 'Path costs' },
  { id: 'funding', label: 'Funding' },
]

function fmtMeta(m: AssumptionMeta, v: number): string {
  switch (m.kind) {
    case 'money':
      return f.money(v, { compact: v >= 10_000 })
    case 'percent':
      return f.pct(v, v < 0.1 && v > 0 ? 1 : 0)
    case 'month':
      return m.key === 'unwindMonths' || m.key === 'sandboxWithdrawAfter' || m.key === 'foreignMonths' ? `${v} mo` : `month ${v}`
    default:
      return f.users(v)
  }
}

function AssumptionField({ m }: { m: AssumptionMeta }) {
  const { assumptions, setAssumption } = useApp()
  const v = assumptions[m.key]
  const changed = v !== DEFAULT_ASSUMPTIONS[m.key]
  return (
    <div className="py-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-ink">
          {m.label}
          {changed && <span className="ms-1 text-xs text-accent-ink">(changed)</span>}
        </span>
        <SourceTag source={m.source} />
      </div>
      {m.kind === 'bool' ? (
        <div className="mt-1">
          <Switch checked={v as boolean} onChange={(nv) => setAssumption(m.key, nv as Assumptions[typeof m.key])} label={(v as boolean) ? 'Yes' : 'No'} />
        </div>
      ) : (
        <label className="mt-1 block">
          <span className="sr-only">{m.label}</span>
          <span className="flex items-center gap-3">
            <input
              type="range"
              min={m.min}
              max={m.max}
              step={m.step}
              value={v as number}
              onChange={(e) => setAssumption(m.key, Number(e.target.value) as Assumptions[typeof m.key])}
            />
            <span className="tabular w-20 shrink-0 text-end text-sm font-medium text-ink">{fmtMeta(m, v as number)}</span>
          </span>
        </label>
      )}
      <p className="mt-0.5 text-xs text-muted">{m.help}</p>
    </div>
  )
}

export function AssumptionsDrawer() {
  const { inputsOpen, setInputsOpen, resetAssumptions, t, reduceMotion, lang } = useApp()
  useEffect(() => {
    if (!inputsOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setInputsOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputsOpen, setInputsOpen])
  const fromX = lang === 'ar' ? '-100%' : '100%'
  return (
    <AnimatePresence>
      {inputsOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInputsOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t('inputs')}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-line bg-surface shadow-2xl"
            initial={reduceMotion ? { opacity: 0 } : { x: fromX }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: fromX }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-line p-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{t('inputs')}</h2>
                <p className="text-xs text-ink-2">Every view updates as you change these.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={resetAssumptions} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-2 hover:text-ink">
                  {t('reset')}
                </button>
                <button type="button" onClick={() => setInputsOpen(false)} className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink" autoFocus>
                  {t('close')}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-3 rounded-lg bg-surface-2 p-3 text-xs text-ink-2">
                Fixed from the case: spread inputs (3.8% / 3.5% / 0.25%), acquisition cost ${CASE.acquisitionCost}, pilot cap {f.users(CASE.sandboxPilotCap)}.
              </div>
              {GROUPS.map((g) => (
                <details key={g.id} open={g.id === 'business' || g.id === 'regulation'} className="border-b border-line py-2">
                  <summary className="cursor-pointer py-1 text-sm font-semibold text-ink">{g.label}</summary>
                  <div className="divide-y divide-line">
                    {ASSUMPTION_META.filter((m) => m.group === g.id).map((m) => (
                      <AssumptionField key={m.key} m={m} />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

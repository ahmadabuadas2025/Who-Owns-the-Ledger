import { animate, motion } from 'framer-motion'
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { GLOSSARY_BY_ID } from '../data/glossary'
import { useApp } from '../lib/state'
import type { Source } from '../sim'

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}

/** "From the case" vs "Assumption" chip. Text + shape, never colour alone. */
export function SourceTag({ source, className = '' }: { source: Source | 'model'; className?: string }) {
  const { t } = useApp()
  if (source === 'model')
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1 py-0.5 text-[11px] font-medium text-muted ${className}`}
        title="Calculated by the model from case figures and assumptions"
      >
        <span aria-hidden>◎</span>
        {t('modelResult')}
      </span>
    )
  return source === 'case' ? (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2 ${className}`}
      title="This figure comes from the case study"
    >
      <span aria-hidden>●</span>
      {t('fromCase')}
    </span>
  ) : (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-axis px-2 py-0.5 text-[11px] font-medium text-ink-2 ${className}`}
      title="This input is not in the case; it is an adjustable assumption"
    >
      <span aria-hidden>◇</span>
      {t('assumption')}
    </span>
  )
}

/** A finance term with a plain-language tooltip from the glossary. */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY_BY_ID[id]
  const tipId = useId()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])
  if (!entry) return <>{children}</>
  return (
    <span ref={ref} className="group relative inline">
      <button
        type="button"
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="cursor-help border-b border-dotted border-current p-0 text-inherit [font:inherit]"
      >
        {children ?? entry.term}
      </button>
      <span
        role="tooltip"
        id={tipId}
        className={`pointer-events-none absolute start-0 top-full z-40 mt-1 w-64 max-w-[80vw] rounded-lg border border-line bg-surface p-3 text-start text-xs font-normal leading-snug text-ink-2 shadow-lg ${
          open ? 'block' : 'hidden group-hover:block group-focus-within:block'
        }`}
      >
        <strong className="block text-sm text-ink">{entry.term}</strong>
        {entry.short}
        {entry.example && <em className="mt-1 block not-italic text-muted">e.g. {entry.example}</em>}
      </span>
    </span>
  )
}

/** Number that tweens to its new value (instant when motion is reduced). */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const { reduceMotion } = useApp()
  const [shown, setShown] = useState(value)
  const last = useRef(value)
  useEffect(() => {
    if (reduceMotion || !Number.isFinite(value) || !Number.isFinite(last.current)) {
      last.current = value
      setShown(value)
      return
    }
    const c = animate(last.current, value, {
      duration: 0.45,
      ease: 'easeOut',
      onUpdate: (v) => setShown(v),
    })
    last.current = value
    return () => c.stop()
  }, [value, reduceMotion])
  return <>{format(shown)}</>
}

export function KpiTile({
  label,
  value,
  format,
  hint,
  source,
  tone = 'neutral',
  delta,
}: {
  label: ReactNode
  value: number
  format: (n: number) => string
  hint?: ReactNode
  source?: Source | 'model'
  tone?: 'neutral' | 'good' | 'bad'
  delta?: ReactNode
}) {
  const { learnMode } = useApp()
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-ink-2 sm:text-sm">{label}</span>
        {source && <SourceTag source={source} />}
      </div>
      <span
        className={`mt-1 text-2xl font-semibold tracking-tight sm:text-3xl ${
          tone === 'bad' ? 'text-critical-ink' : tone === 'good' ? 'text-good-ink' : 'text-ink'
        }`}
      >
        <AnimatedNumber value={value} format={format} />
      </span>
      {delta && <span className="mt-0.5 text-xs text-ink-2">{delta}</span>}
      {learnMode && hint && <span className="mt-1 text-xs leading-snug text-muted">{hint}</span>}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-lg bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-axis'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${checked ? 'end-0.5' : 'start-0.5'}`}
        />
        <span className="sr-only">{checked ? 'on' : 'off'}</span>
      </button>
      <span>{label}</span>
    </label>
  )
}

/** Small legend/marker swatch for a strategy: colour + line style + shape. */
export function SeriesSwatch({ color, dash, marker }: { color: string; dash: string; marker: string }) {
  return (
    <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden className="shrink-0">
      <line x1="1" y1="6" x2="27" y2="6" stroke={color} strokeWidth="2" strokeDasharray={dash === '0' ? undefined : dash} />
      <MarkerShape shape={marker} x={14} y={6} r={4} color={color} />
    </svg>
  )
}

export function MarkerShape({ shape, x, y, r, color }: { shape: string; x: number; y: number; r: number; color: string }) {
  const ring = { stroke: 'var(--surface)', strokeWidth: 1.5 }
  switch (shape) {
    case 'square':
      return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={color} {...ring} />
    case 'triangle':
      return <polygon points={`${x},${y - r - 1} ${x + r + 1},${y + r} ${x - r - 1},${y + r}`} fill={color} {...ring} />
    case 'diamond':
      return <polygon points={`${x},${y - r - 1} ${x + r + 1},${y} ${x},${y + r + 1} ${x - r - 1},${y}`} fill={color} {...ring} />
    case 'star': {
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r + 1.5 : (r + 1.5) / 2.2
        const a = (Math.PI / 5) * i - Math.PI / 2
        pts.push(`${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`)
      }
      return <polygon points={pts.join(' ')} fill={color} {...ring} />
    }
    case 'cross':
      return (
        <path
          d={`M${x - r},${y - r}L${x + r},${y + r}M${x + r},${y - r}L${x - r},${y + r}`}
          stroke={color}
          strokeWidth={2.5}
        />
      )
    default:
      return <circle cx={x} cy={y} r={r} fill={color} {...ring} />
  }
}

export function Badge({ tone, children }: { tone: 'good' | 'bad' | 'neutral'; children: ReactNode }) {
  const icon = tone === 'good' ? '✓' : tone === 'bad' ? '!' : '•'
  const cls =
    tone === 'good'
      ? 'text-good-ink'
      : tone === 'bad'
        ? 'text-critical-ink'
        : 'text-ink-2'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
      <span
        aria-hidden
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          tone === 'good' ? 'bg-good' : tone === 'bad' ? 'bg-critical' : 'bg-axis'
        }`}
      >
        {icon}
      </span>
      {children}
    </span>
  )
}

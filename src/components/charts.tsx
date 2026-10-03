import type { ReactNode } from 'react'
import type { EventKind, SimEvent } from '../sim'

export const EVENT_ICON: Record<EventKind, string> = {
  cost: '$',
  nonObjection: '✓',
  pilot: '◆',
  launch: '▲',
  rules: '§',
  withdrawn: '↩',
  unwind: '✕',
  funding: '+',
  outOfCash: '!',
  sandboxDenied: '⊘',
}

export const EVENT_NAME: Record<EventKind, string> = {
  cost: 'Cost paid',
  nonObjection: 'Non-objection',
  pilot: 'Pilot starts',
  launch: 'Launch to all',
  rules: 'Rules decision',
  withdrawn: 'Sandbox withdrawn',
  unwind: 'Unwind',
  funding: 'Funding',
  outOfCash: 'Out of cash',
  sandboxDenied: 'Sandbox denied',
}

/** Events worth a marker on the time charts. */
export const MARKER_KINDS: EventKind[] = ['pilot', 'launch', 'rules', 'unwind', 'outOfCash', 'funding', 'withdrawn']

export const axisProps = {
  stroke: 'var(--axis)',
  tick: { fill: 'var(--muted)', fontSize: 12 },
  tickLine: false,
} as const

export const gridProps = {
  stroke: 'var(--grid)',
  strokeDasharray: undefined,
  vertical: false,
} as const

export function toneColor(tone: SimEvent['tone']) {
  return tone === 'good' ? 'var(--good)' : tone === 'bad' ? 'var(--critical)' : 'var(--muted)'
}

/** Tooltip shell styled with the tokens. */
export function TipBox({ title, rows }: { title: ReactNode; rows: { label: ReactNode; value: ReactNode; swatch?: ReactNode }[] }) {
  return (
    <div className="min-w-44 rounded-lg border border-line bg-surface p-2.5 text-xs shadow-lg">
      <div className="mb-1 font-semibold text-ink">{title}</div>
      <table className="w-full">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-0.5 pe-3 text-ink-2">
                <span className="inline-flex items-center gap-1.5">
                  {r.swatch}
                  {r.label}
                </span>
              </td>
              <td className="tabular py-0.5 text-end font-medium text-ink">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Legend row built in HTML so it wraps and reads well on phones. */
export function Legend({ items }: { items: { key: string; label: ReactNode; swatch: ReactNode }[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {items.map((i) => (
        <li key={i.key} className="inline-flex items-center gap-1.5">
          {i.swatch}
          {i.label}
        </li>
      ))}
    </ul>
  )
}

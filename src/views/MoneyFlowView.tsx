import { motion } from 'framer-motion'
import { useState } from 'react'
import { Card, SourceTag, Term } from '../components/ui'
import * as f from '../lib/format'
import { useApp } from '../lib/state'
import { CASE, lifetimeValue, moneyFlow } from '../sim'

export function MoneyFlowView() {
  const { reduceMotion } = useApp()
  const [balance, setBalance] = useState<number>(CASE.avgBalance)
  const [users, setUsers] = useState<number>(CASE.activeUsers)
  const flow = moneyFlow(balance)
  const gain = lifetimeValue(CASE.churnWith) - lifetimeValue(CASE.churnWithout)

  return (
    <div className="space-y-4">
      <Card
        title="Where one user's Nest Yield money goes in a year"
        subtitle="The stablecoin's reserves earn interest. Nestwise's share is 3.8% of the balance; most of it is passed on."
        actions={<SourceTag source="case" />}
      >
        <FlowDiagram flow={flow} animateDots={!reduceMotion} />
        <label className="mt-4 block max-w-md text-sm text-ink-2">
          <span className="flex justify-between">
            <span>Balance in Nest Yield</span>
            <span className="tabular font-semibold text-ink">{f.money(balance)}</span>
          </span>
          <input type="range" min={100} max={4000} step={50} value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
          <span className="text-xs text-muted">Case average: $800.</span>
        </label>
      </Card>

      <Card
        title="The spread is tiny. Keeping users is the prize."
        subtitle="Per user, per the case's Exhibit 2. All three bars use the same dollar scale."
      >
        <CompareBars
          rows={[
            { label: <>Nest Yield <Term id="spread">spread</Term>, per year</>, value: flow.kept, note: `${f.pct(CASE.reserveIncomeRate, 1)} − ${f.pct(CASE.rewardRate, 1)} − ${f.pct(CASE.custodyCostRate, 2)} of ${f.money(balance)}` },
            { label: <><Term id="interchange">Interchange</Term> + early-pay fees, per year</>, value: CASE.otherRevenuePerUserYear, note: 'about $5 a month' },
            { label: <>Extra <Term id="ltv">lifetime value</Term> from lower <Term id="churn">churn</Term></>, value: gain, note: '$200 (40 months) − $125 (25 months)' },
          ]}
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm text-ink-2 sm:col-span-3">
            <span className="flex justify-between">
              <span>Users in Nest Yield</span>
              <span className="tabular font-semibold text-ink">{f.users(users)}</span>
            </span>
            <input type="range" min={1000} max={60000} step={1000} value={users} onChange={(e) => setUsers(Number(e.target.value))} />
          </label>
          <Stat label="Spread kept per year" value={f.money(flow.kept * users)} />
          <Stat label="Fee revenue per year" value={f.money(CASE.otherRevenuePerUserYear * users, { compact: true })} />
          <Stat label="Lifetime value gained" value={f.money(gain * users, { compact: true })} />
        </div>
        <p className="mt-3 text-sm text-ink-2">
          At 21,000 users the spread is about <strong className="text-ink">$8,400 a year</strong> — less than two days of burn. The real value of
          Nest Yield is that users with it leave less often: <strong className="text-ink">$75 more lifetime revenue each, about $1.58M</strong>{' '}
          across today&apos;s users.
        </p>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-xs text-ink-2">{label}</div>
      <div className="tabular text-xl font-semibold text-ink">{value}</div>
    </div>
  )
}

function CompareBars({ rows }: { rows: { label: React.ReactNode; value: number; note: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={i} className="grid gap-1 sm:grid-cols-[16rem_1fr] sm:items-center sm:gap-3">
          <div className="text-sm text-ink">
            {r.label}
            <span className="block text-xs text-muted">{r.note}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 flex-1">
              <motion.div
                className="h-full rounded-e"
                style={{ background: 'var(--s-mine)', minWidth: 2 }}
                initial={false}
                animate={{ width: `${(r.value / max) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="tabular w-16 shrink-0 text-end text-sm font-semibold text-ink">{f.money(r.value, { cents: r.value < 10 })}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Sankey-style split: balance → reserve income → rewards / costs / kept. */
function FlowDiagram({ flow, animateDots }: { flow: ReturnType<typeof moneyFlow>; animateDots: boolean }) {
  const W = 760
  const H = 300
  const scale = 150 / flow.reserveIncome // px of band height per dollar
  const hR = flow.rewards * scale
  const hC = flow.costs * scale
  const hK = Math.max(flow.kept * scale, 1.5)
  const srcY = 75
  const total = hR + hC + hK
  const outs = [
    { key: 'rewards', label: 'Rewards to the user', value: flow.rewards, y: 40, h: hR, color: 'var(--s-mine)', pct: CASE.rewardRate },
    { key: 'costs', label: 'Custody & compliance', value: flow.costs, y: 190, h: hC, color: 'var(--s-wait)', pct: CASE.custodyCostRate },
    { key: 'kept', label: 'Kept by Nestwise', value: flow.kept, y: 255, h: hK, color: 'var(--s-structure)', pct: CASE.reserveIncomeRate - CASE.rewardRate - CASE.custodyCostRate },
  ]
  let offset = 0
  const x0 = 250
  const x1 = 520
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full min-w-[620px] max-w-4xl" role="img" aria-label={`A ${f.money(flow.balance)} balance earns ${f.money(flow.reserveIncome, { cents: true })} a year for Nestwise: ${f.money(flow.rewards, { cents: true })} paid as rewards, ${f.money(flow.costs, { cents: true })} for custody and compliance, ${f.money(flow.kept, { cents: true })} kept.`}>
        {/* Balance box */}
        <rect x={10} y={srcY - 10} width={150} height={total + 20} rx={10} fill="var(--surface-2)" stroke="var(--border)" />
        <text x={85} y={srcY + total / 2 - 8} textAnchor="middle" fontSize={13} fill="var(--ink-2)">User balance</text>
        <text x={85} y={srcY + total / 2 + 14} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--ink)">{f.money(flow.balance)}</text>
        <text x={85} y={srcY + total + 32} textAnchor="middle" fontSize={11} fill="var(--muted)">held by an outside custodian</text>
        {/* Arrow to income */}
        <path d={`M160 ${srcY + total / 2} H${x0 - 10}`} stroke="var(--axis)" strokeWidth={2} markerEnd="url(#arrow)" />
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--axis)" />
          </marker>
        </defs>
        {/* Income node */}
        <rect x={x0} y={srcY} width={14} height={total} rx={3} fill="var(--ink-2)" />
        <text x={x0 + 7} y={srcY - 22} textAnchor="middle" fontSize={12} fill="var(--ink-2)">Reserve income (3.8%)</text>
        <text x={x0 + 7} y={srcY - 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--ink)">{f.money(flow.reserveIncome, { cents: true })} / yr</text>
        {outs.map((o) => {
          const sy = srcY + offset + o.h / 2
          offset += o.h
          const ty = o.y + o.h / 2
          const d = `M${x0 + 14} ${sy} C ${(x0 + x1) / 2} ${sy}, ${(x0 + x1) / 2} ${ty}, ${x1} ${ty}`
          return (
            <g key={o.key}>
              <path id={`flow-${o.key}`} d={d} stroke={o.color} strokeOpacity={0.45} strokeWidth={Math.max(o.h, 1.5)} fill="none" />
              <rect x={x1} y={o.y} width={10} height={Math.max(o.h, 2)} rx={2} fill={o.color} />
              <text x={x1 + 20} y={ty - 4} fontSize={13} fill="var(--ink-2)">{o.label} ({f.pct(o.pct, o.pct < 0.01 ? 2 : 1)})</text>
              <text x={x1 + 20} y={ty + 15} fontSize={17} fontWeight={700} fill="var(--ink)">{f.money(o.value, { cents: true })}</text>
              {animateDots &&
                [0, 1, 2].map((i) => (
                  <circle key={i} r={3.5} fill={o.color} stroke="var(--surface)" strokeWidth={1}>
                    <animateMotion dur="2.4s" begin={`-${i * 0.8}s`} repeatCount="indefinite">
                      <mpath href={`#flow-${o.key}`} />
                    </animateMotion>
                  </circle>
                ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Badge, Card, Segmented, SourceTag, Term } from '../components/ui'
import * as f from '../lib/format'
import { useApp } from '../lib/state'
import { CASE } from '../sim'

type Mode = 'then' | 'now'
type Record_ = 'cleartally' | 'cardinal'

export function LedgerView() {
  const [mode, setMode] = useState<Mode>('then')
  const [collapsed, setCollapsed] = useState(false)
  const [record, setRecord] = useState<Record_>('cardinal')
  const h = CASE.history

  return (
    <div className="space-y-4">
      <Card
        title="Who owns the ledger? Then vs now"
        subtitle="The ledger is the list of who owns which dollars. Watch where it lives."
        actions={
          <Segmented
            label="Model"
            value={mode}
            onChange={(v) => {
              setMode(v)
              setCollapsed(false)
            }}
            options={[
              { value: 'then', label: 'Then: Stackline' },
              { value: 'now', label: 'Now: the plan' },
            ]}
          />
        }
      >
        {mode === 'then' ? (
          <>
            <ThenDiagram collapsed={collapsed} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${collapsed ? 'border border-line text-ink-2' : 'bg-critical text-white'}`}
              >
                {collapsed ? '⟲ Reset' : '✕ March 2025: Stackline fails'}
              </button>
              <p className="text-sm text-ink-2">
                {collapsed
                  ? 'Stackline cuts off the banks’ access to the ledger. The banks still hold the money but see only one total per pooled account — nobody can say whose dollars are whose.'
                  : <>Stackline alone kept the ledger. Nobody supervised it. Banks held pooled <Term id="fbo">FBO accounts</Term> and saw one total each.</>}
              </p>
            </div>
          </>
        ) : (
          <>
            <NowDiagram record={record} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-ink">Official ledger of record:</span>
              <Segmented
                label="Ledger of record"
                value={record}
                onChange={setRecord}
                options={[
                  { value: 'cardinal', label: 'Cardinal' },
                  { value: 'cleartally', label: 'ClearTally' },
                ]}
              />
            </div>
            <RecordCompare record={record} />
          </>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="The hole in the ledger" subtitle="March 2025: what the ledger said vs what the banks held." actions={<SourceTag source="case" />}>
          <Bars
            rows={[
              { label: 'Owed to users (per the ledger)', value: h.ledgerOwed },
              { label: 'Held by the banks', value: h.banksHeld },
              { label: 'Missing', value: h.missing, bad: true },
            ]}
          />
          <p className="mt-3 text-sm text-ink-2">
            {f.money(h.missing, { compact: true })} — about {f.pct(h.missing / h.ledgerOwed)} — could not be matched to anyone.{' '}
            <Term id="fdic">FDIC insurance</Term> did not apply: the banks had not failed; Stackline had, and it was not a bank.
          </p>
        </Card>
        <Card title="Rosa's savings" subtitle="One Nestwise user." actions={<SourceTag source="case" />}>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <div className="text-xs text-ink-2">Saved</div>
              <div className="tabular text-3xl font-semibold text-ink">{f.money(h.rosaSaved)}</div>
            </div>
            <div className="text-2xl text-muted" aria-hidden>→</div>
            <div>
              <div className="text-xs text-ink-2">Got back after {h.rosaWaitMonths} months</div>
              <div className="tabular text-3xl font-semibold text-ink">{f.money(h.rosaGotBack)}</div>
            </div>
            <Badge tone="bad">Lost {f.money(h.rosaSaved - h.rosaGotBack)} ({f.pct((h.rosaSaved - h.rosaGotBack) / h.rosaSaved)})</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-surface-2 p-2">
              <dt className="text-xs text-ink-2">Funds returned by Sept 2026</dt>
              <dd className="font-semibold text-ink">about {f.pct(h.returnedShare)}</dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-2">
              <dt className="text-xs text-ink-2">Still owed to ex-Nestwise users</dt>
              <dd className="font-semibold text-ink">{f.money(h.stillOwedNestwise, { compact: true })}</dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-2">
              <dt className="text-xs text-ink-2">Nestwise users before → now</dt>
              <dd className="font-semibold text-ink">
                {f.users(h.nestwiseUsersBefore)} → {f.users(CASE.activeUsers)}
              </dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-2">
              <dt className="text-xs text-ink-2">Cardinal deposits 2019 / 2024 / 2026</dt>
              <dd className="font-semibold text-ink">{h.cardinalDeposits.map((d) => f.money(d.value, { compact: true })).join(' / ')}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}

function Bars({ rows }: { rows: { label: string; value: number; bad?: boolean }[] }) {
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm">
            <span className="text-ink-2">{r.label}</span>
            <span className="tabular font-semibold text-ink">{f.money(r.value, { compact: true })}</span>
          </div>
          <div className="mt-1 h-4 rounded bg-surface-2">
            <motion.div
              className="h-full rounded"
              style={{ background: r.bad ? 'var(--critical)' : 'var(--s-mine)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(r.value / max) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---- Diagrams --------------------------------------------------------------

interface NodeSpec {
  id: string
  x: number
  y: number
  w: number
  h: number
  title: string
  sub?: string
  tone?: 'normal' | 'warn' | 'dead' | 'good'
  badge?: string
}

function Node({ n }: { n: NodeSpec }) {
  const stroke = n.tone === 'warn' ? 'var(--serious)' : n.tone === 'dead' ? 'var(--critical)' : n.tone === 'good' ? 'var(--good)' : 'var(--axis)'
  return (
    <motion.g initial={false} animate={{ opacity: n.tone === 'dead' ? 0.85 : 1 }}>
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={12} fill="var(--surface)" stroke={stroke} strokeWidth={n.tone && n.tone !== 'normal' ? 2.5 : 1.5} />
      <text x={n.x + n.w / 2} y={n.y + (n.sub ? n.h / 2 - 4 : n.h / 2 + 5)} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">
        {n.title}
      </text>
      {n.sub && (
        <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 14} textAnchor="middle" fontSize={11} fill="var(--ink-2)">
          {n.sub}
        </text>
      )}
      {n.tone === 'dead' && (
        <path d={`M${n.x + 8} ${n.y + 8} L${n.x + n.w - 8} ${n.y + n.h - 8} M${n.x + n.w - 8} ${n.y + 8} L${n.x + 8} ${n.y + n.h - 8}`} stroke="var(--critical)" strokeWidth={3} opacity={0.6} />
      )}
      {n.badge && (
        <g>
          <rect x={n.x + n.w / 2 - 68} y={n.y - 13} width={136} height={22} rx={11} fill={n.tone === 'warn' || n.tone === 'dead' ? 'var(--critical)' : 'var(--good-ink)'} />
          <text x={n.x + n.w / 2} y={n.y + 2} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
            {n.badge}
          </text>
        </g>
      )}
    </motion.g>
  )
}

function Edge({ id, d, cut = false, dashed = false, dots = true, color = 'var(--s-mine)' }: { id: string; d: string; cut?: boolean; dashed?: boolean; dots?: boolean; color?: string }) {
  const { reduceMotion } = useApp()
  return (
    <g>
      <path id={id} d={d} fill="none" stroke={cut ? 'var(--critical)' : 'var(--axis)'} strokeWidth={2} strokeDasharray={dashed || cut ? '6 5' : undefined} />
      {!reduceMotion && dots && !cut &&
        [0, 1].map((i) => (
          <circle key={i} r={4} fill={color} stroke="var(--surface)" strokeWidth={1}>
            <animateMotion dur="2.2s" begin={`-${i * 1.1}s`} repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        ))}
    </g>
  )
}

function ThenDiagram({ collapsed }: { collapsed: boolean }) {
  const nodes: NodeSpec[] = [
    { id: 'users', x: 10, y: 110, w: 130, h: 60, title: 'Users', sub: '≈ 400,000' },
    { id: 'apps', x: 190, y: 110, w: 140, h: 60, title: 'Fintech apps', sub: 'Nestwise and others' },
    { id: 'stack', x: 390, y: 100, w: 170, h: 80, title: 'Stackline', sub: collapsed ? 'bankrupt, access cut' : 'middleware · unsupervised', tone: collapsed ? 'dead' : 'warn', badge: 'ONLY LEDGER' },
    { id: 'b1', x: 620, y: 30, w: 150, h: 56, title: 'Cardinal', sub: 'pooled FBO: one total' },
    { id: 'b2', x: 620, y: 112, w: 150, h: 56, title: 'Bank B', sub: 'pooled FBO: one total' },
    { id: 'b3', x: 620, y: 194, w: 150, h: 56, title: 'Bank C', sub: 'pooled FBO: one total' },
  ]
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 780 280" className="mx-auto h-auto w-full min-w-[620px] max-w-4xl" role="img" aria-label={collapsed ? 'Stackline has failed; the link between apps and banks is cut and nobody else has the ledger.' : 'Users use fintech apps, which connect through Stackline, the only keeper of the ledger, to pooled accounts at several banks.'}>
        <Edge id="t1" d="M140 140 H190" />
        <Edge id="t2" d="M330 140 H390" />
        <Edge id="t3" d="M560 130 C 590 130, 590 58, 620 58" cut={collapsed} />
        <Edge id="t4" d="M560 140 H620" cut={collapsed} />
        <Edge id="t5" d="M560 150 C 590 150, 590 222, 620 222" cut={collapsed} />
        {nodes.map((n) => (
          <Node key={n.id} n={n} />
        ))}
        <AnimatePresence>
          {collapsed && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <text x={475} y={215} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--critical-ink)">
                Ledger: owed $148M
              </text>
              <text x={475} y={233} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--critical-ink)">
                Banks hold: $121M
              </text>
              <text x={475} y={255} textAnchor="middle" fontSize={12} fill="var(--ink-2)">
                $27M missing · accounts frozen
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  )
}

function NowDiagram({ record }: { record: Record_ }) {
  const nodes: NodeSpec[] = [
    { id: 'users', x: 10, y: 130, w: 120, h: 60, title: 'Users', sub: '≈ 21,000' },
    { id: 'app', x: 170, y: 130, w: 185, h: 60, title: 'Nestwise app', sub: 'direct contract, no middleware' },
    {
      id: 'cardinal',
      x: 440,
      y: 30,
      w: 230,
      h: 70,
      title: 'Cardinal Bank',
      sub: 'cash in FBO accounts · FDIC + state',
      tone: record === 'cardinal' ? 'good' : 'normal',
      badge: record === 'cardinal' ? 'LEDGER OF RECORD' : undefined,
    },
    { id: 'cust', x: 440, y: 220, w: 230, h: 70, title: 'Outside custodian', sub: 'holds the Nest Yield stablecoin' },
    {
      id: 'ct',
      x: 700,
      y: 125,
      w: 140,
      h: 70,
      title: 'ClearTally',
      sub: 'nightly check',
      tone: record === 'cleartally' ? 'warn' : 'normal',
      badge: record === 'cleartally' ? 'LEDGER OF RECORD' : undefined,
    },
  ]
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 850 300" className="mx-auto h-auto w-full min-w-[620px] max-w-4xl" role="img" aria-label={`Users use the Nestwise app. Cash sits at Cardinal Bank; Nest Yield balances sit with an outside custodian. ClearTally reconciles the app, its own records and Cardinal every night. Ledger of record: ${record === 'cardinal' ? 'Cardinal' : 'ClearTally'}.`}>
        <Edge id="n1" d="M130 160 H170" />
        <Edge id="n2" d="M355 148 C 400 148, 400 65, 440 65" />
        <Edge id="n3" d="M355 172 C 400 172, 400 255, 440 255" color="var(--s-structure)" />
        <Edge id="n4" d="M670 65 C 740 65, 770 80, 770 125" dashed dots={false} />
        <Edge id="n5" d="M355 160 H700" dashed dots={false} />
        <text x={555} y={154} textAnchor="middle" fontSize={11} fill="var(--muted)">reconciled every night</text>
        <text x={405} y={92} textAnchor="middle" fontSize={11} fill="var(--muted)">cash</text>
        <text x={405} y={236} textAnchor="middle" fontSize={11} fill="var(--muted)">stablecoin</text>
        {nodes.map((n) => (
          <Node key={n.id} n={n} />
        ))}
      </svg>
    </div>
  )
}

const COMPARE: { aspect: string; cardinal: string; cleartally: string; source: 'case' | 'assumption' }[] = [
  {
    aspect: 'Who supervises the official record',
    cardinal: 'The FDIC and the state regulator; Cardinal is under a consent order.',
    cleartally: 'Nobody directly: ClearTally is a vendor, not a bank (my reading).',
    source: 'assumption',
  },
  {
    aspect: 'Single point of failure?',
    cardinal: 'Less so: the bank holds the money and the record; ClearTally stays as an independent nightly check.',
    cleartally: 'Yes, again a non-bank vendor holds the only official list — the Stackline pattern, though Cardinal’s own balances allow a check.',
    source: 'assumption',
  },
  { aspect: 'Cost', cardinal: 'About $1.1M for Cardinal’s own system.', cleartally: 'Vendor fee (not given in the case).', source: 'case' },
  { aspect: 'Time to ready', cardinal: '6–8 months to build.', cleartally: 'Available now.', source: 'case' },
  {
    aspect: 'Effect on regulators’ non-objection',
    cardinal: 'Fits the consent order (independent reconciliation of every FBO account): most likely to be accepted.',
    cleartally: 'Regulators may object to a vendor holding the record after Stackline (my reading).',
    source: 'assumption',
  },
]

function RecordCompare({ record }: { record: Record_ }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-2">
            <th className="py-2 pe-3 text-start font-medium">What changes</th>
            <th className={`px-2 py-2 text-start font-medium ${record === 'cardinal' ? 'text-ink' : ''}`}>Cardinal as record {record === 'cardinal' && '✓'}</th>
            <th className={`px-2 py-2 text-start font-medium ${record === 'cleartally' ? 'text-ink' : ''}`}>ClearTally as record {record === 'cleartally' && '✓'}</th>
            <th className="ps-2 py-2 text-start font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE.map((c) => (
            <tr key={c.aspect} className="border-b border-line align-top">
              <td className="py-2 pe-3 font-medium text-ink">{c.aspect}</td>
              <td className={`px-2 py-2 ${record === 'cardinal' ? 'bg-accent-wash text-ink' : 'text-ink-2'}`}>{c.cardinal}</td>
              <td className={`px-2 py-2 ${record === 'cleartally' ? 'bg-accent-wash text-ink' : 'text-ink-2'}`}>{c.cleartally}</td>
              <td className="ps-2 py-2">
                <SourceTag source={c.source} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">
        &ldquo;My solution&rdquo; picks Cardinal as the ledger of record with ClearTally as the nightly independent check. Who pays the $1.1M is not
        stated in the case; the simulator assumes Cardinal does.
      </p>
    </div>
  )
}

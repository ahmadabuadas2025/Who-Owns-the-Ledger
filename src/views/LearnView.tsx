import { useState } from 'react'
import { Card, SourceTag } from '../components/ui'
import { GLOSSARY } from '../data/glossary'
import * as f from '../lib/format'
import { useApp } from '../lib/state'
import { ASSUMPTION_META, CASE, DEFAULT_ASSUMPTIONS, MODEL_READINGS } from '../sim'

export function LearnView() {
  const { t, lang } = useApp()
  const [q, setQ] = useState('')
  const terms = GLOSSARY.filter((g) => (g.term + g.short + g.termAr).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-4">
      <Card title={t('glossary')} subtitle="Plain-language definitions. The same text appears when you hover or tap a dotted term anywhere in the app.">
        <label className="mb-3 block max-w-sm">
          <span className="sr-only">Search the glossary</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms…"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted"
          />
        </label>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((g) => (
            <div key={g.id} className="rounded-xl bg-surface-2 p-3">
              <dt className="text-sm font-semibold text-ink">
                {g.term}
                {lang === 'ar' && <span className="ms-2 font-normal text-ink-2">{g.termAr}</span>}
              </dt>
              <dd className="mt-1 text-sm text-ink-2">{g.short}</dd>
              {g.example && <dd className="mt-1 text-xs text-muted">e.g. {g.example}</dd>}
            </div>
          ))}
        </dl>
      </Card>

      <Card title={t('formulas')}>
        <ul className="space-y-2 text-sm text-ink-2">
          <Formula name="Revenue per user per month" expr="$60 ÷ 12 = $5" />
          <Formula name="Nest Yield spread per user per year" expr="(3.8% − 3.5% − 0.25%) × $800 = $0.40" />
          <Formula name="Users next month" expr="users × (1 − churn); churn 2.5% with Nest Yield, 4.0% without" />
          <Formula name="Expected lifetime" expr="1 ÷ churn → 25 months without, 40 months with" />
          <Formula name="Lifetime revenue" expr="$5 × lifetime → $125 without, $200 with (+$75)" />
          <Formula name="Cash next month" expr="cash − burn + (revenue this month − today's revenue) − path cost due + funding" />
          <Formula name="Runway" expr="cash ÷ (burn − (revenue − today's revenue))" />
        </ul>
        <h3 className="mt-5 text-sm font-semibold text-ink">Checks the tests reproduce</h3>
        <ul className="mt-2 grid gap-1 text-sm text-ink-2 sm:grid-cols-2">
          <li>Spread: $0.40/user/yr; ≈ $8,400/yr at 21,000 users</li>
          <li>Lifetime: 25 mo / $125 vs 40 mo / $200; +$75 × 21,000 = $1,575,000</li>
          <li>Users after 12 months: 12,867 vs 15,498 (2,631 ≈ $118K to replace)</li>
          <li>Year-one revenue: $975,971 vs $1,072,897</li>
          <li>Each month of delay: ≈ 315 users, $14,175 to replace, $63,000 lifetime revenue</li>
        </ul>
      </Card>

      <Card title={`${t('assumptionsList')} — not in the case`} subtitle="Every one is adjustable in Inputs.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-2">
                <th className="py-2 pe-3 text-start font-medium">Input</th>
                <th className="px-2 py-2 text-end font-medium">Default</th>
                <th className="ps-2 py-2 text-start font-medium">Why</th>
              </tr>
            </thead>
            <tbody>
              {ASSUMPTION_META.filter((m) => m.source === 'assumption').map((m) => {
                const v = DEFAULT_ASSUMPTIONS[m.key]
                const shown =
                  typeof v === 'boolean'
                    ? v
                      ? 'yes'
                      : 'no'
                    : m.kind === 'money'
                      ? f.money(v, { compact: v >= 10_000 })
                      : m.kind === 'percent'
                        ? f.pct(v)
                        : m.kind === 'month'
                          ? `${v}`
                          : f.users(v)
                return (
                  <tr key={m.key} className="border-b border-line align-top">
                    <td className="py-2 pe-3 text-ink">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {m.label} <SourceTag source="assumption" />
                      </span>
                    </td>
                    <td className="tabular px-2 py-2 text-end font-medium text-ink">{shown}</td>
                    <td className="ps-2 py-2 text-ink-2">{m.help}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <h3 className="mt-5 text-sm font-semibold text-ink">How the model reads the case</h3>
        <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm text-ink-2">
          {MODEL_READINGS.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </Card>

      <Card title="Case figures used" subtitle="Exhibit 2 and the narrative.">
        <ul className="grid gap-x-6 gap-y-1 text-sm text-ink-2 sm:grid-cols-2">
          <CaseRow label="Average Nest Yield balance" value={f.money(CASE.avgBalance)} />
          <CaseRow label="Nestwise share of reserve income" value={f.pct(CASE.reserveIncomeRate, 1)} />
          <CaseRow label="Rewards paid to users" value={f.pct(CASE.rewardRate, 1)} />
          <CaseRow label="Custody and compliance" value={f.pct(CASE.custodyCostRate, 2)} />
          <CaseRow label="Other revenue per active user" value="≈ $60 / year" />
          <CaseRow label="Monthly churn without / with" value="4.0% / 2.5%" />
          <CaseRow label="Cost to acquire a user" value={f.money(CASE.acquisitionCost)} />
          <CaseRow label="Users / burn / runway" value="21,000 / $650K / 9 mo" />
          <CaseRow label="Sandbox pilot cap" value="≈ 2,000 users" />
          <CaseRow label="Projected new Cardinal deposits" value="$60M in a year" />
        </ul>
      </Card>

      <Card title="About">
        <p className="text-sm text-ink-2">
          A class project for FIT6050 Foundations of FinTech (Pillar 3). Stackline, Nestwise, Cardinal Bank &amp; Trust, ClearTally and Paylo are
          fictional; the case is loosely based on the 2024 Synapse collapse. The CFPB sandbox history is real. Nothing here is financial or legal
          advice.
        </p>
      </Card>
    </div>
  )
}

function Formula({ name, expr }: { name: string; expr: string }) {
  return (
    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <span className="font-medium text-ink sm:w-64 sm:shrink-0">{name}</span>
      <code className="rounded bg-surface-2 px-2 py-0.5 text-[13px] text-ink">{expr}</code>
    </li>
  )
}

function CaseRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3 border-b border-line py-1.5">
      <span>{label}</span>
      <span className="inline-flex items-center gap-2 font-medium text-ink">
        {value}
        <SourceTag source="case" />
      </span>
    </li>
  )
}

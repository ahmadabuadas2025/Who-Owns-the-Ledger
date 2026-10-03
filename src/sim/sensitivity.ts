import type { Assumptions, PathId } from './config'
import { simulate } from './engine'
import type { CustomConfig } from './strategies'

export type Metric = 'users24' | 'users12' | 'cash12' | 'cash24' | 'revenue'

export const METRICS: { id: Metric; label: string; unit: 'users' | 'money' }[] = [
  { id: 'users12', label: 'Active users at month 12', unit: 'users' },
  { id: 'users24', label: 'Active users at month 24', unit: 'users' },
  { id: 'cash12', label: 'Cash at month 12', unit: 'money' },
  { id: 'cash24', label: 'Cash at month 24', unit: 'money' },
  { id: 'revenue', label: 'Total revenue over the horizon', unit: 'money' },
]

interface Lever {
  key: keyof Assumptions
  label: string
  low: Assumptions[keyof Assumptions]
  high: Assumptions[keyof Assumptions]
  lowLabel: string
  highLabel: string
}

export const LEVERS: Lever[] = [
  { key: 'churnWithout', label: 'Churn without Nest Yield', low: 0.03, high: 0.05, lowLabel: '3%', highLabel: '5%' },
  { key: 'churnWith', label: 'Churn with Nest Yield', low: 0.02, high: 0.03, lowLabel: '2%', highLabel: '3%' },
  { key: 'participation', label: 'Participation', low: 0.5, high: 1, lowLabel: '50%', highLabel: '100%' },
  { key: 'rulesMonth', label: 'Rules month', low: 4, high: 9, lowLabel: 'month 4', highLabel: 'month 9' },
  { key: 'rulesFavorable', label: 'Rules allow rewards', low: false, high: true, lowLabel: 'no', highLabel: 'yes' },
  { key: 'nonObjectionMonth', label: 'Cardinal non-objection', low: 0, high: 6, lowLabel: 'month 0', highLabel: 'month 6' },
  { key: 'sandboxApproved', label: 'Sandbox approved', low: false, high: true, lowLabel: 'no', highLabel: 'yes' },
  { key: 'otherRevenuePerUserYear', label: 'Revenue per user', low: 40, high: 80, lowLabel: '$40/yr', highLabel: '$80/yr' },
  { key: 'monthlyBurn', label: 'Monthly burn', low: 550_000, high: 750_000, lowLabel: '$550K', highLabel: '$750K' },
  { key: 'startingCash', label: 'Starting cash', low: 4_500_000, high: 7_200_000, lowLabel: '$4.5M', highLabel: '$7.2M' },
  { key: 'unwindLoss', label: 'Users lost at unwind', low: 0.05, high: 0.3, lowLabel: '5%', highLabel: '30%' },
  { key: 'avgBalance', label: 'Average balance', low: 400, high: 1600, lowLabel: '$400', highLabel: '$1,600' },
]

export function metricOf(pathId: PathId, a: Assumptions, metric: Metric, custom?: CustomConfig): number {
  const s = simulate(pathId, a, custom).summary
  switch (metric) {
    case 'users12':
      return s.usersAt12
    case 'users24':
      return s.usersAt24
    case 'cash12':
      return s.cashAt12
    case 'cash24':
      return s.cashAt24
    case 'revenue':
      return s.totalRevenue
  }
}

export interface TornadoBar {
  key: string
  label: string
  lowLabel: string
  highLabel: string
  low: number
  high: number
  base: number
  swing: number
}

/** One-at-a-time sensitivity: set each lever to its low and high value, keep the rest at base. */
export function tornado(pathId: PathId, base: Assumptions, metric: Metric, custom?: CustomConfig): TornadoBar[] {
  const baseValue = metricOf(pathId, base, metric, custom)
  return LEVERS.map((l) => {
    const low = metricOf(pathId, { ...base, [l.key]: l.low }, metric, custom)
    const high = metricOf(pathId, { ...base, [l.key]: l.high }, metric, custom)
    return {
      key: l.key,
      label: l.label,
      lowLabel: l.lowLabel,
      highLabel: l.highLabel,
      low,
      high,
      base: baseValue,
      swing: Math.abs(high - low),
    }
  }).sort((x, y) => y.swing - x.swing)
}

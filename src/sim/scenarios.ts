import type { Assumptions } from './config'
import { DEFAULT_ASSUMPTIONS } from './config'

export interface Scenario {
  id: string
  name: string
  description: string
  changes: Partial<Assumptions>
}

/** One-click "what if" presets. Each applies on top of the defaults. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'hoped',
    name: 'Rules land as hoped',
    description: 'Final rules allow pass-through rewards, the issuer is approved, the sandbox is approved and stays.',
    changes: { rulesFavorable: true, sandboxApproved: true, sandboxWithdrawn: false },
  },
  {
    id: 'differently',
    name: 'Rules land differently',
    description: 'Final rules do not allow pass-through rewards. Any path that already launched must unwind.',
    changes: { rulesFavorable: false },
  },
  {
    id: 'withdrawn',
    name: 'Sandbox approved, then withdrawn',
    description: 'The sandbox is approved, then revoked two months into the pilot, as happened to Upstart and PayActiv in 2022.',
    changes: { sandboxApproved: true, sandboxWithdrawn: true, sandboxWithdrawAfter: 2 },
  },
  {
    id: 'cardinal',
    name: 'Cardinal delayed 4 months',
    description: 'Regulators take four extra months to say they do not object to Cardinal\'s new partner.',
    changes: { nonObjectionMonth: DEFAULT_ASSUMPTIONS.nonObjectionMonth + 4 },
  },
  {
    id: 'funding',
    name: 'Funding round in month 6',
    description: 'A $5M round closes in month 6.',
    changes: { fundingEnabled: true, fundingMonth: 6, fundingAmount: 5_000_000 },
  },
  {
    id: 'paylo',
    name: 'Paylo gets more aggressive',
    description: 'Churn for users without Nest Yield rises from 4% to 5% a month.',
    changes: { churnWithout: 0.05 },
  },
]

export function applyScenario(id: string, base: Assumptions = DEFAULT_ASSUMPTIONS): Assumptions {
  const s = SCENARIOS.find((x) => x.id === id)
  return s ? { ...base, ...s.changes } : base
}

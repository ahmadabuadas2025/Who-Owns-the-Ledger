/**
 * Every number the simulator uses lives here.
 *
 * - `CASE` holds figures taken straight from the case study ("from the case").
 * - `DEFAULT_ASSUMPTIONS` holds inputs the case does not give us ("assumption").
 *   Each one is adjustable in the UI and documented in ASSUMPTION_META.
 */

export type Source = 'case' | 'assumption'

/** Figures from "Who Owns the Ledger?" (Exhibit 2 and the narrative). */
export const CASE = {
  /** Average Nest Yield balance per participating user ($). */
  avgBalance: 800,
  /** Nestwise share of the issuer's reserve income, as a share of balances per year. */
  reserveIncomeRate: 0.038,
  /** Rewards paid to users, share of balances per year. */
  rewardRate: 0.035,
  /** Custody + compliance costs, share of balances per year. */
  custodyCostRate: 0.0025,
  /** Other revenue per active user per year: interchange + early-pay fees ($). */
  otherRevenuePerUserYear: 60,
  /** Monthly churn without Nest Yield. */
  churnWithout: 0.04,
  /** Monthly churn for users who hold Nest Yield. */
  churnWith: 0.025,
  /** Cost to acquire one new user ($). */
  acquisitionCost: 45,
  /** Active users today (Sept 2026). */
  activeUsers: 21_000,
  /** Monthly burn ($). */
  monthlyBurn: 650_000,
  /** Runway today (months). */
  runwayMonths: 9,
  /** Cap on users in a U.S. sandbox pilot. */
  sandboxPilotCap: 2_000,
  /** Projected new deposits for Cardinal within a year of relaunch ($). */
  projectedNewDeposits: 60_000_000,
  /** Cost of Cardinal building its own ledger system ($). */
  cardinalLedgerCost: 1_100_000,
  /** Time for Cardinal to build its own ledger system (months). */
  cardinalLedgerMonths: [6, 8] as const,
  /** Background facts about the collapse. */
  history: {
    stacklineUsers: 400_000,
    nestwiseUsersBefore: 58_000,
    nestwiseFundsBefore: 31_000_000,
    ledgerOwed: 148_000_000,
    banksHeld: 121_000_000,
    missing: 27_000_000,
    rosaSaved: 4_180,
    rosaGotBack: 3_470,
    rosaWaitMonths: 7,
    returnedShare: 0.85,
    stillOwedNestwise: 5_200_000,
    cardinalDeposits: [
      { label: '2019', value: 520_000_000 },
      { label: '2024', value: 1_300_000_000 },
      { label: 'Sept 2026', value: 790_000_000 },
    ],
  },
} as const

export type PathId = 'wait' | 'structure' | 'sandbox' | 'foreign' | 'mine' | 'custom'

export interface Assumptions {
  /** Simulation horizon (months). */
  horizon: number
  /** Cash in the bank at month 0 ($). Default 9 × $650K. */
  startingCash: number
  /** Monthly burn, already net of today's revenue ($). */
  monthlyBurn: number
  /** Starting active users. */
  startingUsers: number
  /** Other revenue per user per year ($). */
  otherRevenuePerUserYear: number
  /** Average Nest Yield balance ($). */
  avgBalance: number
  /** Monthly churn without / with Nest Yield. */
  churnWithout: number
  churnWith: number
  /** Share of eligible users who opt into Nest Yield (0–1). */
  participation: number

  /** Month Path 2 launches (case range 1–3, "about 2 months"). */
  structureLaunchMonth: number
  /** Month the sandbox decision lands and the pilot can start (case range 4–6). */
  sandboxDecisionMonth: number
  /** Months spent abroad before a U.S. launch under Path 4 (case range 6–12). */
  foreignMonths: number
  /** Month final rules + issuer approval land; Path 1's launch month (case range 4–9). */
  rulesMonth: number
  /** Whether the final rules allow pass-through rewards. */
  rulesFavorable: boolean
  /** Probability the final rules allow pass-through rewards (Monte Carlo). */
  pRulesFavorable: number

  /** Month Cardinal receives regulatory non-objection. */
  nonObjectionMonth: number
  /** Cardinal is refused outright: nothing can launch in the U.S. */
  nonObjectionRefused: boolean

  /** Whether the sandbox application is approved (deterministic run). */
  sandboxApproved: boolean
  /** Whether sandbox relief is later withdrawn (deterministic run). */
  sandboxWithdrawn: boolean
  /** Months after pilot start that a withdrawal hits. */
  sandboxWithdrawAfter: number
  /** Probability the sandbox application is approved (Monte Carlo). */
  pSandboxApproved: number
  /** Probability sandbox relief is later withdrawn (Monte Carlo). */
  pSandboxWithdrawn: number

  /** One-time share of Nest Yield users lost when the product is unwound. */
  unwindLoss: number
  /** Monthly churn of unwound users while trust recovers. */
  unwindChurn: number
  /** How many months the higher unwind churn lasts. */
  unwindMonths: number
  /** "My solution" uses Path 2's conservative legal design: multiplier on unwind loss. */
  conservativeDesignFactor: number

  /** Up-front costs per path ($). */
  costWait: number
  costStructure: number
  costSandbox: number
  costForeign: number
  costMine: number

  /** Optional funding round. */
  fundingEnabled: boolean
  fundingAmount: number
  fundingMonth: number

  /** Monte Carlo: chance Cardinal's non-objection slips by `nonObjectionSlip` months, per path. */
  nonObjectionSlip: number
  pSlip: Record<Exclude<PathId, 'custom'>, number> & { custom: number }
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  horizon: 24,
  startingCash: CASE.runwayMonths * CASE.monthlyBurn,
  monthlyBurn: CASE.monthlyBurn,
  startingUsers: CASE.activeUsers,
  otherRevenuePerUserYear: CASE.otherRevenuePerUserYear,
  avgBalance: CASE.avgBalance,
  churnWithout: CASE.churnWithout,
  churnWith: CASE.churnWith,
  participation: 1,

  structureLaunchMonth: 2,
  sandboxDecisionMonth: 5,
  foreignMonths: 9,
  rulesMonth: 7,
  rulesFavorable: true,
  pRulesFavorable: 0.6,

  nonObjectionMonth: 2,
  nonObjectionRefused: false,

  sandboxApproved: true,
  sandboxWithdrawn: false,
  sandboxWithdrawAfter: 2,
  pSandboxApproved: 0.7,
  pSandboxWithdrawn: 0.1,

  unwindLoss: 0.15,
  unwindChurn: 0.05,
  unwindMonths: 3,
  conservativeDesignFactor: 0.5,

  costWait: 0,
  costStructure: 150_000,
  costSandbox: 200_000,
  costForeign: 400_000,
  costMine: 250_000,

  fundingEnabled: false,
  fundingAmount: 5_000_000,
  fundingMonth: 6,

  nonObjectionSlip: 4,
  pSlip: { wait: 0.1, structure: 0.35, sandbox: 0.1, foreign: 0.15, mine: 0.1, custom: 0.2 },
}

export type AssumptionKey = Exclude<keyof Assumptions, 'pSlip'>

export interface AssumptionMeta {
  key: AssumptionKey
  label: string
  help: string
  source: Source
  kind: 'money' | 'percent' | 'month' | 'count' | 'bool'
  min?: number
  max?: number
  step?: number
  group: 'business' | 'timing' | 'regulation' | 'unwind' | 'costs' | 'funding'
}

/** Labels, ranges and provenance for every adjustable input. */
export const ASSUMPTION_META: AssumptionMeta[] = [
  { key: 'startingCash', label: 'Starting cash', help: '9 months × $650K burn. The case gives runway and burn, not a cash balance.', source: 'assumption', kind: 'money', min: 1_000_000, max: 12_000_000, step: 50_000, group: 'business' },
  { key: 'monthlyBurn', label: 'Monthly burn', help: 'Money spent each month beyond what comes in. Assumed to be already net of today\'s revenue.', source: 'case', kind: 'money', min: 300_000, max: 1_000_000, step: 10_000, group: 'business' },
  { key: 'startingUsers', label: 'Active users today', help: 'People actively using Nestwise in Sept 2026.', source: 'case', kind: 'count', min: 5_000, max: 60_000, step: 500, group: 'business' },
  { key: 'otherRevenuePerUserYear', label: 'Revenue per user per year', help: 'Interchange + early-pay fees, about $60 a year ($5 a month).', source: 'case', kind: 'money', min: 20, max: 120, step: 5, group: 'business' },
  { key: 'avgBalance', label: 'Average Nest Yield balance', help: 'Average amount a participating user keeps in Nest Yield.', source: 'case', kind: 'money', min: 100, max: 3_000, step: 50, group: 'business' },
  { key: 'churnWithout', label: 'Monthly churn without Nest Yield', help: 'Share of users who leave each month.', source: 'case', kind: 'percent', min: 0.01, max: 0.1, step: 0.0025, group: 'business' },
  { key: 'churnWith', label: 'Monthly churn with Nest Yield', help: 'Share of Nest Yield users who leave each month.', source: 'case', kind: 'percent', min: 0.005, max: 0.08, step: 0.0025, group: 'business' },
  { key: 'participation', label: 'Nest Yield participation', help: 'Share of eligible users who move money into Nest Yield.', source: 'assumption', kind: 'percent', min: 0, max: 1, step: 0.05, group: 'business' },

  { key: 'structureLaunchMonth', label: 'Path 2 launch month', help: 'Case: about 2 months.', source: 'assumption', kind: 'month', min: 1, max: 3, step: 1, group: 'timing' },
  { key: 'sandboxDecisionMonth', label: 'Sandbox decision / pilot start', help: 'Case: 4–6 months. Default is the midpoint.', source: 'assumption', kind: 'month', min: 4, max: 6, step: 1, group: 'timing' },
  { key: 'foreignMonths', label: 'Months abroad before U.S. launch (Path 4)', help: 'Case: 6–12 months. Default is the midpoint.', source: 'assumption', kind: 'month', min: 6, max: 12, step: 1, group: 'timing' },
  { key: 'rulesMonth', label: 'Final rules + issuer approval', help: 'Case: 4–9 months. Default 7 (midpoint 6.5, rounded up). Path 1 launches here; "My solution" scales here.', source: 'assumption', kind: 'month', min: 4, max: 9, step: 1, group: 'timing' },

  { key: 'rulesFavorable', label: 'Rules allow pass-through rewards', help: 'If off, the rules land differently: anything live is unwound and nothing new launches.', source: 'assumption', kind: 'bool', group: 'regulation' },
  { key: 'pRulesFavorable', label: 'Chance rules allow rewards', help: 'Used by the Monte Carlo runs.', source: 'assumption', kind: 'percent', min: 0, max: 1, step: 0.05, group: 'regulation' },
  { key: 'nonObjectionMonth', label: 'Cardinal non-objection month', help: 'No product can go live before regulators say they do not object to Cardinal\'s new partner.', source: 'assumption', kind: 'month', min: 0, max: 12, step: 1, group: 'regulation' },
  { key: 'nonObjectionRefused', label: 'Non-objection refused', help: 'Cardinal never gets the green light: nothing launches in the U.S.', source: 'assumption', kind: 'bool', group: 'regulation' },
  { key: 'sandboxApproved', label: 'Sandbox approved', help: 'Whether the U.S. sandbox application is approved (affects Path 3 and "My solution").', source: 'assumption', kind: 'bool', group: 'regulation' },
  { key: 'sandboxWithdrawn', label: 'Sandbox later withdrawn', help: 'Regulators revoke the relief, as the CFPB did in 2022.', source: 'assumption', kind: 'bool', group: 'regulation' },
  { key: 'sandboxWithdrawAfter', label: 'Withdrawal hits after (months)', help: 'Months after the pilot starts.', source: 'assumption', kind: 'month', min: 1, max: 12, step: 1, group: 'regulation' },
  { key: 'pSandboxApproved', label: 'Chance sandbox approved', help: 'Used by the Monte Carlo runs.', source: 'assumption', kind: 'percent', min: 0, max: 1, step: 0.05, group: 'regulation' },
  { key: 'pSandboxWithdrawn', label: 'Chance sandbox withdrawn', help: 'Used by the Monte Carlo runs.', source: 'assumption', kind: 'percent', min: 0, max: 1, step: 0.05, group: 'regulation' },

  { key: 'unwindLoss', label: 'Users lost at unwind', help: 'One-time share of Nest Yield users who leave when the product is unwound.', source: 'assumption', kind: 'percent', min: 0, max: 0.5, step: 0.01, group: 'unwind' },
  { key: 'unwindChurn', label: 'Churn after unwind', help: 'Monthly churn of unwound users while trust recovers.', source: 'assumption', kind: 'percent', min: 0.02, max: 0.15, step: 0.005, group: 'unwind' },
  { key: 'unwindMonths', label: 'Months of higher churn', help: 'How long the post-unwind churn lasts.', source: 'assumption', kind: 'month', min: 0, max: 12, step: 1, group: 'unwind' },
  { key: 'conservativeDesignFactor', label: '"My solution" unwind severity', help: 'Path 2\'s conservative legal design means an unwind hurts less. 50% = half the one-time loss.', source: 'assumption', kind: 'percent', min: 0, max: 1, step: 0.05, group: 'unwind' },

  { key: 'costWait', label: 'Path 1 up-front cost', help: 'Case: "minimal". Assumed $0.', source: 'assumption', kind: 'money', min: 0, max: 200_000, step: 5_000, group: 'costs' },
  { key: 'costStructure', label: 'Path 2 up-front cost', help: 'Case: about $150K.', source: 'case', kind: 'money', min: 0, max: 600_000, step: 10_000, group: 'costs' },
  { key: 'costSandbox', label: 'Path 3 up-front cost', help: 'Case: about $200K.', source: 'case', kind: 'money', min: 0, max: 600_000, step: 10_000, group: 'costs' },
  { key: 'costForeign', label: 'Path 4 up-front cost', help: 'Case: about $400K+.', source: 'case', kind: 'money', min: 0, max: 1_000_000, step: 10_000, group: 'costs' },
  { key: 'costMine', label: '"My solution" up-front cost', help: 'Sandbox ($200K) + extra legal work for the conservative design ($50K).', source: 'assumption', kind: 'money', min: 0, max: 800_000, step: 10_000, group: 'costs' },

  { key: 'fundingEnabled', label: 'Funding round', help: 'Add a one-time cash injection.', source: 'assumption', kind: 'bool', group: 'funding' },
  { key: 'fundingAmount', label: 'Funding amount', help: 'Size of the round.', source: 'assumption', kind: 'money', min: 500_000, max: 20_000_000, step: 250_000, group: 'funding' },
  { key: 'fundingMonth', label: 'Funding month', help: 'When the money arrives.', source: 'assumption', kind: 'month', min: 1, max: 24, step: 1, group: 'funding' },
]

/** Reading of the case that the model takes where the case is silent or ambiguous. */
export const MODEL_READINGS: string[] = [
  'Month 0 is today (Sept 2026). Revenue for a month is counted on the users still active at the end of that month; this reproduces the case\'s year-one revenue figures.',
  'Cash next month = cash − burn + (revenue − today\'s revenue) − path cost due + funding. The $650K burn already includes today\'s $105K a month of revenue.',
  'Up-front path costs are paid in month 1.',
  'Path 1\'s launch month is the month final rules and issuer approval land ("rules month"). Paths 1, 3, 4 and "My solution" all need that event to reach every user.',
  'No product (pilot or full) can go live before Cardinal\'s regulatory non-objection. If it is refused, nothing launches in the U.S.',
  'If the rules land differently (no pass-through rewards), everything live is unwound at the rules month and Nest Yield does not relaunch within the horizon.',
  'Path 3 alone pilots with up to 2,000 users and needs a second approval to scale; it scales at the later of the rules month and 6 months after the pilot starts.',
  'Path 4 launches in the U.S. at the later of its time abroad and the rules month.',
  '"My solution": pilot at the sandbox decision, scale to everyone at the rules month, with an unwind half as severe because of the conservative legal design.',
  'If the sandbox is not approved, Path 3 and "My solution" skip the pilot and wait for the rules month.',
  'An unwind removes a one-time share of Nest Yield users; the rest return to normal accounts with higher churn for a few months, then normal churn.',
  'Users only move into Nest Yield at launch events; later churn is tracked separately for each group. No paid acquisition is modelled.',
  'Nest Yield\'s spread ($0.40 per user per year) is added to revenue. The case\'s year-one revenue figures exclude it.',
  'Cardinal pays for its own ledger system; Nestwise\'s cash is not affected by the ledger-of-record choice.',
  'Monte Carlo: each path also carries a chance that Cardinal\'s non-objection slips by 4 months (Path 2 highest, because it is the least regulator-friendly).',
]

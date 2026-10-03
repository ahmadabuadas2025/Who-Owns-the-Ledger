import type { Assumptions, PathId } from './config'
import { CASE } from './config'

/** A concrete plan the engine can run, resolved from a strategy and the assumptions. */
export interface PlanSpec {
  /** Sandbox pilot: starts at `month` with at most `cap` users. Needs sandbox approval. */
  pilot: { month: number; cap: number } | null
  /**
   * Launch to everyone.
   * - `month`: launches at a fixed month, before final rules (exposed to an unwind).
   * - `rules`: waits for final rules + issuer approval, and not before `notBefore`.
   */
  full: { trigger: 'month'; month: number } | { trigger: 'rules'; notBefore: number } | null
  /** Up-front cost, paid in month 1. */
  cost: number
  /** Multiplier on the one-time unwind loss. */
  unwindFactor: number
}

/** Choices for the custom strategy builder. */
export interface CustomConfig {
  pilotEnabled: boolean
  pilotMonth: number
  pilotCap: number
  fullEnabled: boolean
  fullTrigger: 'month' | 'rules'
  fullMonth: number
  cost: number
}

export const DEFAULT_CUSTOM: CustomConfig = {
  pilotEnabled: true,
  pilotMonth: 3,
  pilotCap: 5_000,
  fullEnabled: true,
  fullTrigger: 'rules',
  fullMonth: 6,
  cost: 200_000,
}

export interface StrategyMeta {
  id: PathId
  number: string
  name: string
  short: string
  summary: string
  upfront: string
  timing: string
  good: string
  bad: string
  /** Line style so colour is never the only signal. */
  dash: string
  marker: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'cross'
}

export const STRATEGIES: StrategyMeta[] = [
  {
    id: 'wait',
    number: '1',
    name: 'Wait and comply',
    short: 'Wait',
    summary: 'Do nothing new until final rules land and the issuer is approved, then launch to everyone.',
    upfront: 'Minimal',
    timing: '4–9 months',
    good: 'Lowest legal risk',
    bad: 'Users keep leaving, runway shrinks',
    dash: '0',
    marker: 'circle',
  },
  {
    id: 'structure',
    number: '2',
    name: 'Structure around the gap',
    short: 'Structure',
    summary: 'Use a legal structure that works under today\'s rules and launch to everyone fast.',
    upfront: 'about $150K',
    timing: 'about 2 months',
    good: 'Fastest',
    bad: 'May have to unwind in front of users burned once',
    dash: '8 4',
    marker: 'square',
  },
  {
    id: 'sandbox',
    number: '3',
    name: 'U.S. sandbox pilot',
    short: 'Sandbox',
    summary: 'Ask a U.S. regulator for a sandbox and pilot with up to 2,000 users.',
    upfront: 'about $200K',
    timing: '4–6 months to a decision; capped at about 2,000 users',
    good: 'Regulator on board, small blast radius',
    bad: 'Covers only part of the product; policy can be reversed',
    dash: '2 3',
    marker: 'triangle',
  },
  {
    id: 'foreign',
    number: '4',
    name: 'Foreign sandbox / MiCA first',
    short: 'Foreign',
    summary: 'Launch abroad under clear rules first, then come to the U.S.',
    upfront: 'about $400K+',
    timing: '6–12 months abroad before any U.S. launch',
    good: 'Clear rules, credibility',
    bad: 'Slow, costly, not tested on U.S. gig workers',
    dash: '12 3 2 3',
    marker: 'diamond',
  },
  {
    id: 'mine',
    number: '★',
    name: 'My solution',
    short: 'Mine',
    summary:
      'Path 3 as the core, built to Path 2\'s conservative legal design, scaled to all users under Path 1\'s trigger.',
    upfront: 'about $250K (assumption)',
    timing: 'Pilot at months 4–6, everyone when rules land',
    good: 'An unwind hits 2,000 users, not 21,000; real retention data for the next round',
    bad: 'Still depends on the rules and on Cardinal\'s non-objection',
    dash: '0',
    marker: 'star',
  },
  {
    id: 'custom',
    number: '+',
    name: 'Custom',
    short: 'Custom',
    summary: 'Build your own: choose what to launch, when, and to how many users.',
    upfront: 'You choose',
    timing: 'You choose',
    good: '—',
    bad: '—',
    dash: '4 2',
    marker: 'cross',
  },
]

export const STRATEGY_BY_ID = Object.fromEntries(STRATEGIES.map((s) => [s.id, s])) as Record<
  PathId,
  StrategyMeta
>

/** The five named strategies (custom excluded), used by compare views. */
export const NAMED_PATHS: PathId[] = ['wait', 'structure', 'sandbox', 'foreign', 'mine']

/** Turn a strategy into a concrete plan under the given assumptions. */
export function resolvePlan(id: PathId, a: Assumptions, custom: CustomConfig = DEFAULT_CUSTOM): PlanSpec {
  switch (id) {
    case 'wait':
      return { pilot: null, full: { trigger: 'rules', notBefore: 0 }, cost: a.costWait, unwindFactor: 1 }
    case 'structure':
      return {
        pilot: null,
        full: { trigger: 'month', month: a.structureLaunchMonth },
        cost: a.costStructure,
        unwindFactor: 1,
      }
    case 'sandbox':
      return {
        pilot: { month: a.sandboxDecisionMonth, cap: CASE.sandboxPilotCap },
        full: { trigger: 'rules', notBefore: a.sandboxDecisionMonth + 6 },
        cost: a.costSandbox,
        unwindFactor: 1,
      }
    case 'foreign':
      return {
        pilot: null,
        full: { trigger: 'rules', notBefore: a.foreignMonths },
        cost: a.costForeign,
        unwindFactor: 1,
      }
    case 'mine':
      return {
        pilot: { month: a.sandboxDecisionMonth, cap: CASE.sandboxPilotCap },
        full: { trigger: 'rules', notBefore: 0 },
        cost: a.costMine,
        unwindFactor: a.conservativeDesignFactor,
      }
    case 'custom':
      return {
        pilot: custom.pilotEnabled ? { month: custom.pilotMonth, cap: custom.pilotCap } : null,
        full: custom.fullEnabled
          ? custom.fullTrigger === 'rules'
            ? { trigger: 'rules', notBefore: custom.fullMonth }
            : { trigger: 'month', month: custom.fullMonth }
          : null,
        cost: custom.cost,
        unwindFactor: 1,
      }
  }
}

import type { Assumptions, PathId } from './config'
import { simulate } from './engine'
import { mulberry32, quantile, randInt } from './random'
import type { CustomConfig } from './strategies'

export interface Spread {
  min: number
  p10: number
  p50: number
  p90: number
  max: number
}

export interface FanPoint {
  month: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface MonteCarloResult {
  pathId: PathId
  runs: number
  /** Share of runs that run out of cash within the horizon. */
  pOutOfCash: number
  /** Share of runs that run out of cash by month 12. */
  pOutOfCashBy12: number
  /** Median month cash runs out (null if most runs survive the horizon). */
  medianOutOfCashMonth: number | null
  /** Share of runs with an unwind. */
  pUnwind: number
  /** Share of runs where Nest Yield reaches everyone. */
  pFullLaunch: number
  users12: Spread
  users24: Spread
  cash12: Spread
  cash24: Spread
  usersFan: FanPoint[]
  cashFan: FanPoint[]
}

/**
 * Draw one set of uncertain inputs. Uses only the run's own RNG, so run i
 * sees the same world for every strategy (common random numbers).
 */
export function sampleAssumptions(base: Assumptions, pathId: PathId, rng: () => number): Assumptions {
  const rulesFavorable = rng() < base.pRulesFavorable
  const sandboxApproved = rng() < base.pSandboxApproved
  const withdrawnDraw = rng()
  const withdrawAfter = randInt(rng, 1, 6)
  const slipDraw = rng()
  const rulesMonth = randInt(rng, 4, 9)
  const structureLaunchMonth = randInt(rng, 1, 3)
  const sandboxDecisionMonth = randInt(rng, 4, 6)
  const foreignMonths = randInt(rng, 6, 12)
  const participation = Math.min(1, Math.max(0, base.participation * (0.75 + 0.25 * rng())))
  return {
    ...base,
    rulesFavorable,
    sandboxApproved,
    sandboxWithdrawn: sandboxApproved && withdrawnDraw < base.pSandboxWithdrawn,
    sandboxWithdrawAfter: withdrawAfter,
    nonObjectionMonth: base.nonObjectionMonth + (slipDraw < base.pSlip[pathId] ? base.nonObjectionSlip : 0),
    rulesMonth,
    structureLaunchMonth,
    sandboxDecisionMonth,
    foreignMonths,
    participation,
  }
}

function spread(values: number[]): Spread {
  const s = [...values].sort((x, y) => x - y)
  return { min: s[0], p10: quantile(s, 0.1), p50: quantile(s, 0.5), p90: quantile(s, 0.9), max: s[s.length - 1] }
}

function fan(series: number[][], horizon: number): FanPoint[] {
  const out: FanPoint[] = []
  for (let m = 0; m <= horizon; m++) {
    const s = series.map((r) => r[m]).sort((x, y) => x - y)
    out.push({
      month: m,
      p10: quantile(s, 0.1),
      p25: quantile(s, 0.25),
      p50: quantile(s, 0.5),
      p75: quantile(s, 0.75),
      p90: quantile(s, 0.9),
    })
  }
  return out
}

export function monteCarlo(
  pathId: PathId,
  base: Assumptions,
  runs = 1000,
  seed = 2026,
  custom?: CustomConfig,
): MonteCarloResult {
  const users: number[][] = []
  const cash: number[][] = []
  let outOfCash = 0
  let outBy12 = 0
  let unwinds = 0
  let full = 0
  const outMonths: number[] = []
  for (let i = 0; i < runs; i++) {
    const rng = mulberry32(seed + i * 7919)
    const a = sampleAssumptions(base, pathId, rng)
    const r = simulate(pathId, a, custom)
    users.push(r.months.map((m) => m.users))
    cash.push(r.months.map((m) => m.cash))
    outMonths.push(r.summary.outOfCashMonth ?? Infinity)
    if (r.summary.outOfCashMonth !== null) outOfCash++
    if (r.summary.outOfCashMonth !== null && r.summary.outOfCashMonth <= 12) outBy12++
    if (r.summary.unwound) unwinds++
    if (r.summary.launchMonth !== null) full++
  }
  const H = base.horizon
  const at = (rows: number[][], m: number) => rows.map((r) => r[Math.min(m, H)])
  return {
    pathId,
    runs,
    pOutOfCash: outOfCash / runs,
    pOutOfCashBy12: outBy12 / runs,
    medianOutOfCashMonth: (() => {
      const m = quantile([...outMonths].sort((x, y) => x - y), 0.5)
      return Number.isFinite(m) ? m : null
    })(),
    pUnwind: unwinds / runs,
    pFullLaunch: full / runs,
    users12: spread(at(users, 12)),
    users24: spread(at(users, 24)),
    cash12: spread(at(cash, 12)),
    cash24: spread(at(cash, 24)),
    usersFan: fan(users, H),
    cashFan: fan(cash, H),
  }
}

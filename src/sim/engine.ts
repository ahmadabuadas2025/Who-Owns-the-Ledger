import type { Assumptions, PathId } from './config'
import { DEFAULT_ASSUMPTIONS } from './config'
import { revenuePerUserMonth, spreadRate } from './economics'
import type { CustomConfig, PlanSpec } from './strategies'
import { resolvePlan } from './strategies'

export type EventKind =
  | 'cost'
  | 'nonObjection'
  | 'pilot'
  | 'launch'
  | 'rules'
  | 'withdrawn'
  | 'unwind'
  | 'funding'
  | 'outOfCash'
  | 'sandboxDenied'

export interface SimEvent {
  month: number
  kind: EventKind
  label: string
  detail: string
  tone: 'good' | 'bad' | 'neutral'
}

export interface MonthState {
  month: number
  /** All active users at the end of the month. */
  users: number
  /** Users holding Nest Yield. */
  nyUsers: number
  /** Cash at the end of the month ($). */
  cash: number
  /** Revenue earned this month ($). */
  revenue: number
  cumRevenue: number
  /** Users lost since month 0 (churn + unwind losses). */
  cumLost: number
  /** Users in the best case: everyone eligible gets Nest Yield in month 1, no unwind. */
  bestCaseUsers: number
  /** Months of cash left at this month's net burn (Infinity if cash-flow positive). */
  runway: number
  nyLive: boolean
  pilotLive: boolean
  unwound: boolean
  outOfCash: boolean
}

export interface SimSummary {
  usersAt12: number
  usersAt24: number
  cashAt12: number
  cashAt24: number
  /** First month cash goes below zero, or null. */
  outOfCashMonth: number | null
  unwound: boolean
  launchMonth: number | null
  pilotMonth: number | null
  totalRevenue: number
}

export interface SimResult {
  pathId: PathId
  plan: PlanSpec
  /** Index 0 is month 0 (today). */
  months: MonthState[]
  events: SimEvent[]
  summary: SimSummary
}

const fmtUsers = (n: number) => Math.round(n).toLocaleString('en-US')

/** Run one deterministic simulation. Pure: same inputs, same output. */
export function simulate(
  pathId: PathId,
  a: Assumptions = DEFAULT_ASSUMPTIONS,
  custom?: CustomConfig,
  planOverride?: PlanSpec,
): SimResult {
  const plan = planOverride ?? resolvePlan(pathId, a, custom)
  const perMonth = revenuePerUserMonth(a.otherRevenuePerUserYear)
  const spreadPerMonth = (spreadRate() * a.avgBalance) / 12
  const baseline = a.startingUsers * perMonth
  const H = a.horizon
  const atLeast1 = (m: number) => Math.max(1, Math.round(m))

  // ---- Schedule -------------------------------------------------------------
  const nonObj = a.nonObjectionRefused ? Infinity : atLeast1(a.nonObjectionMonth)
  const rulesMonth = atLeast1(a.rulesMonth)
  const pilotMonth =
    plan.pilot && a.sandboxApproved ? Math.max(atLeast1(plan.pilot.month), nonObj) : null
  const withdrawMonth =
    pilotMonth !== null && a.sandboxWithdrawn ? pilotMonth + Math.max(1, a.sandboxWithdrawAfter) : null
  let fullMonth: number | null = null
  if (plan.full?.trigger === 'month') fullMonth = Math.max(atLeast1(plan.full.month), nonObj)
  if (plan.full?.trigger === 'rules' && a.rulesFavorable)
    fullMonth = Math.max(rulesMonth, atLeast1(plan.full.notBefore), nonObj)
  if (fullMonth !== null && !Number.isFinite(fullMonth)) fullMonth = null
  // After unfavorable rules, nothing new launches.
  const blockedAfterRules = (m: number) => !a.rulesFavorable && m >= rulesMonth
  const effPilot = pilotMonth !== null && Number.isFinite(pilotMonth) && !blockedAfterRules(pilotMonth) ? pilotMonth : null
  const effFull = fullMonth !== null && !blockedAfterRules(fullMonth) ? fullMonth : null

  // ---- State ----------------------------------------------------------------
  let regular = a.startingUsers
  let ny = 0
  let unwoundCohort = 0
  let unwindLeft = 0
  let cash = a.startingCash
  let cumRevenue = 0
  let cumLost = 0
  let pilotLive = false
  let fullLive = false
  let everUnwound = false
  let outOfCashMonth: number | null = null
  const events: SimEvent[] = []
  const log = (month: number, kind: EventKind, label: string, detail: string, tone: SimEvent['tone']) =>
    events.push({ month, kind, label, detail, tone })

  const bestCase = (t: number) =>
    a.startingUsers * a.participation * Math.pow(1 - a.churnWith, t) +
    a.startingUsers * (1 - a.participation) * Math.pow(1 - a.churnWithout, t)

  const months: MonthState[] = [
    {
      month: 0,
      users: a.startingUsers,
      nyUsers: 0,
      cash,
      revenue: baseline,
      cumRevenue: 0,
      cumLost: 0,
      bestCaseUsers: a.startingUsers,
      runway: a.startingCash / a.monthlyBurn,
      nyLive: false,
      pilotLive: false,
      unwound: false,
      outOfCash: false,
    },
  ]

  const unwind = (t: number, reason: string) => {
    if (ny <= 0) return
    const affected = ny
    const lost = affected * a.unwindLoss * plan.unwindFactor
    cumLost += lost
    unwoundCohort += affected - lost
    ny = 0
    unwindLeft = a.unwindMonths
    pilotLive = false
    fullLive = false
    everUnwound = true
    log(
      t,
      'unwind',
      'Nest Yield unwound',
      `${reason} ${fmtUsers(affected)} users affected; ${fmtUsers(lost)} leave at once, the rest churn at ${(Math.max(a.unwindChurn, a.churnWithout) * 100).toFixed(1)}% for ${a.unwindMonths} months.`,
      'bad',
    )
  }

  /** Move users into Nest Yield until it holds `target` users. */
  const enroll = (target: number) => {
    let need = Math.max(0, target - ny)
    const fromRegular = Math.min(need, regular)
    regular -= fromRegular
    need -= fromRegular
    const fromUnwound = Math.min(need, unwoundCohort)
    unwoundCohort -= fromUnwound
    const moved = fromRegular + fromUnwound
    ny += moved
    return moved
  }

  if (plan.cost > 0) log(1, 'cost', 'Up-front cost paid', `$${plan.cost.toLocaleString('en-US')} for this path.`, 'neutral')
  if (pilotMonth === null && plan.pilot && !a.sandboxApproved)
    log(atLeast1(plan.pilot.month), 'sandboxDenied', 'Sandbox not approved', 'No pilot. The plan waits for final rules instead.', 'bad')

  for (let t = 1; t <= H; t++) {
    // 1. Events.
    if (a.fundingEnabled && t === atLeast1(a.fundingMonth)) {
      cash += a.fundingAmount
      log(t, 'funding', 'Funding round closes', `$${a.fundingAmount.toLocaleString('en-US')} arrives.`, 'good')
    }
    if (t === nonObj && Number.isFinite(nonObj))
      log(t, 'nonObjection', 'Cardinal gets non-objection', 'Regulators do not object to Cardinal\'s new partnership. Products may go live.', 'good')
    if (t === rulesMonth) {
      if (a.rulesFavorable) {
        log(t, 'rules', 'Final rules land: rewards allowed', 'The issuer is approved and pass-through rewards are allowed.', 'good')
      } else {
        log(t, 'rules', 'Final rules land differently', 'Pass-through rewards are not allowed.', 'bad')
        unwind(t, 'The rules do not allow the product.')
      }
    }
    if (withdrawMonth !== null && t === withdrawMonth && pilotLive && !fullLive) {
      log(t, 'withdrawn', 'Sandbox relief withdrawn', 'The regulator revokes the sandbox, as the CFPB did in 2022.', 'bad')
      unwind(t, 'The pilot loses its legal cover.')
    }
    if (effPilot !== null && t === effPilot && !fullLive && (withdrawMonth === null || t < withdrawMonth)) {
      const moved = enroll(Math.min(plan.pilot!.cap, a.participation * (regular + unwoundCohort + ny)))
      pilotLive = true
      log(t, 'pilot', 'Sandbox pilot starts', `${fmtUsers(moved)} users join the Nest Yield pilot.`, 'good')
    }
    if (effFull !== null && t === effFull) {
      const moved = enroll(a.participation * (regular + unwoundCohort + ny))
      fullLive = true
      pilotLive = false
      log(t, 'launch', 'Nest Yield opens to everyone', `${fmtUsers(moved)} more users move into Nest Yield (${fmtUsers(ny)} in total).`, 'good')
    }

    // 2. Churn.
    const before = regular + ny + unwoundCohort
    regular *= 1 - a.churnWithout
    ny *= 1 - a.churnWith
    if (unwoundCohort > 0) {
      unwoundCohort *= 1 - (unwindLeft > 0 ? Math.max(a.unwindChurn, a.churnWithout) : a.churnWithout)
      unwindLeft = Math.max(0, unwindLeft - 1)
      if (unwindLeft === 0) {
        regular += unwoundCohort
        unwoundCohort = 0
      }
    }
    const users = regular + ny + unwoundCohort
    cumLost += before - users

    // 3. Money.
    const revenue = users * perMonth + ny * spreadPerMonth
    cumRevenue += revenue
    cash += -a.monthlyBurn + (revenue - baseline) - (t === 1 ? plan.cost : 0)
    if (cash < 0 && outOfCashMonth === null) {
      outOfCashMonth = t
      log(t, 'outOfCash', 'Out of cash', 'The bank balance goes below zero. Without new money, Nestwise cannot continue.', 'bad')
    }
    const netBurn = a.monthlyBurn - (revenue - baseline)

    months.push({
      month: t,
      users,
      nyUsers: ny,
      cash,
      revenue,
      cumRevenue,
      cumLost,
      bestCaseUsers: bestCase(t),
      runway: netBurn > 0 ? Math.max(0, cash / netBurn) : Infinity,
      nyLive: ny > 0,
      pilotLive,
      unwound: everUnwound,
      outOfCash: outOfCashMonth !== null,
    })
  }

  const order: EventKind[] = ['cost', 'funding', 'nonObjection', 'rules', 'withdrawn', 'unwind', 'sandboxDenied', 'pilot', 'launch', 'outOfCash']
  events.sort((x, y) => x.month - y.month || order.indexOf(x.kind) - order.indexOf(y.kind))

  const at = (m: number) => months[Math.min(m, months.length - 1)]
  return {
    pathId,
    plan,
    months,
    events,
    summary: {
      usersAt12: at(12).users,
      usersAt24: at(24).users,
      cashAt12: at(12).cash,
      cashAt24: at(24).cash,
      outOfCashMonth,
      unwound: everUnwound,
      launchMonth: effFull,
      pilotMonth: effPilot,
      totalRevenue: cumRevenue,
    },
  }
}

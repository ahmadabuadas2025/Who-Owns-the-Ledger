import { CASE } from './config'

/** Other revenue per active user per month: $60 / 12 = $5. */
export function revenuePerUserMonth(perYear: number = CASE.otherRevenuePerUserYear): number {
  return perYear / 12
}

/** Spread rate Nestwise keeps on Nest Yield balances: 3.8% − 3.5% − 0.25% = 0.05%. */
export function spreadRate(
  reserve: number = CASE.reserveIncomeRate,
  rewards: number = CASE.rewardRate,
  costs: number = CASE.custodyCostRate,
): number {
  return reserve - rewards - costs
}

/** Nest Yield spread per participating user per year ($0.40 on $800). */
export function spreadPerUserYear(balance: number = CASE.avgBalance): number {
  return spreadRate() * balance
}

/** How one user's balance splits each year (for the money-flow view). */
export function moneyFlow(balance: number = CASE.avgBalance) {
  return {
    balance,
    reserveIncome: CASE.reserveIncomeRate * balance,
    rewards: CASE.rewardRate * balance,
    costs: CASE.custodyCostRate * balance,
    kept: spreadPerUserYear(balance),
  }
}

/** Expected lifetime in months = 1 / churn. */
export function lifetimeMonths(churn: number): number {
  return 1 / churn
}

/** Lifetime revenue per user = monthly revenue × lifetime. */
export function lifetimeValue(churn: number, perMonth: number = revenuePerUserMonth()): number {
  return perMonth * lifetimeMonths(churn)
}

/** Users left after `months` of constant churn. */
export function usersAfter(start: number, churn: number, months: number): number {
  return start * Math.pow(1 - churn, months)
}

/** Revenue over the first `months`, counted on end-of-month users. */
export function cumulativeRevenue(
  start: number,
  churn: number,
  months: number,
  perMonth: number = revenuePerUserMonth(),
): number {
  let users = start
  let total = 0
  for (let m = 1; m <= months; m++) {
    users *= 1 - churn
    total += users * perMonth
  }
  return total
}

/** What one month of delay costs, for a given user base. */
export function costOfDelayPerMonth(users: number = CASE.activeUsers) {
  const extraUsersLost = users * (CASE.churnWithout - CASE.churnWith)
  return {
    extraUsersLost,
    replacementCost: extraUsersLost * CASE.acquisitionCost,
    lifetimeRevenue: extraUsersLost * lifetimeValue(CASE.churnWith),
  }
}

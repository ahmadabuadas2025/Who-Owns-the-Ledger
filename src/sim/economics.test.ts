import { describe, expect, it } from 'vitest'
import { CASE } from './config'
import {
  costOfDelayPerMonth,
  cumulativeRevenue,
  lifetimeMonths,
  lifetimeValue,
  moneyFlow,
  revenuePerUserMonth,
  spreadPerUserYear,
  usersAfter,
} from './economics'

describe('case numbers (Exhibit 2)', () => {
  it('revenue per user per month is $60 / 12 = $5', () => {
    expect(revenuePerUserMonth()).toBe(5)
  })

  it('Nest Yield spread is $0.40 per user per year, about $8,400 at 21,000 users', () => {
    expect(spreadPerUserYear()).toBeCloseTo(0.4, 10)
    expect(spreadPerUserYear() * CASE.activeUsers).toBeCloseTo(8_400, 6)
  })

  it('one $800 balance earns $30.40: $28.00 rewards, $2.00 costs, $0.40 kept', () => {
    const f = moneyFlow()
    expect(f.reserveIncome).toBeCloseTo(30.4, 10)
    expect(f.rewards).toBeCloseTo(28, 10)
    expect(f.costs).toBeCloseTo(2, 10)
    expect(f.kept).toBeCloseTo(0.4, 10)
    expect(f.rewards + f.costs + f.kept).toBeCloseTo(f.reserveIncome, 10)
  })

  it('lifetime is 25 months / $125 without Nest Yield and 40 months / $200 with it', () => {
    expect(lifetimeMonths(CASE.churnWithout)).toBeCloseTo(25, 10)
    expect(lifetimeValue(CASE.churnWithout)).toBeCloseTo(125, 10)
    expect(lifetimeMonths(CASE.churnWith)).toBeCloseTo(40, 10)
    expect(lifetimeValue(CASE.churnWith)).toBeCloseTo(200, 10)
  })

  it('lifetime gain is $75 per user, $1,575,000 across 21,000 users', () => {
    const gain = lifetimeValue(CASE.churnWith) - lifetimeValue(CASE.churnWithout)
    expect(gain).toBeCloseTo(75, 10)
    expect(gain * CASE.activeUsers).toBeCloseTo(1_575_000, 4)
  })

  it('users after 12 months: 12,867 without, 15,498 with (2,631 more, about $118K to replace)', () => {
    const without = usersAfter(CASE.activeUsers, CASE.churnWithout, 12)
    const withNY = usersAfter(CASE.activeUsers, CASE.churnWith, 12)
    expect(Math.round(without)).toBe(12_867)
    expect(Math.round(withNY)).toBe(15_498)
    const diff = Math.round(withNY) - Math.round(without)
    expect(diff).toBe(2_631)
    expect(Math.round((diff * CASE.acquisitionCost) / 1000)).toBe(118)
  })

  it('year-one revenue: $975,971 without, $1,072,897 with', () => {
    expect(Math.round(cumulativeRevenue(CASE.activeUsers, CASE.churnWithout, 12))).toBe(975_971)
    expect(Math.round(cumulativeRevenue(CASE.activeUsers, CASE.churnWith, 12))).toBe(1_072_897)
  })

  it('each month of delay: ~315 extra users lost, ~$14,175 to replace, $63,000 of lifetime revenue', () => {
    const d = costOfDelayPerMonth()
    expect(d.extraUsersLost).toBeCloseTo(315, 6)
    expect(d.replacementCost).toBeCloseTo(14_175, 4)
    expect(d.lifetimeRevenue).toBeCloseTo(63_000, 4)
  })
})

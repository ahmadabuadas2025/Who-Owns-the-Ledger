import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSUMPTIONS as D } from './config'
import { simulate } from './engine'
import { monteCarlo } from './montecarlo'
import { applyScenario } from './scenarios'
import { tornado } from './sensitivity'
import type { CustomConfig, PlanSpec } from './strategies'
import { NAMED_PATHS } from './strategies'

const nothing: PlanSpec = { pilot: null, full: null, cost: 0, unwindFactor: 1 }
const now: PlanSpec = { pilot: null, full: { trigger: 'month', month: 1 }, cost: 0, unwindFactor: 1 }
const immediate = { ...D, nonObjectionMonth: 0 }

describe('engine reproduces the case numbers', () => {
  it('without Nest Yield: 12,867 users and $975,971 revenue after 12 months', () => {
    const r = simulate('custom', D, undefined, nothing)
    expect(Math.round(r.months[12].users)).toBe(12_867)
    expect(Math.round(r.months[12].cumRevenue)).toBe(975_971)
  })

  it('with Nest Yield from month 1: 15,498 users and $1,072,897 revenue (excluding spread)', () => {
    const r = simulate('custom', { ...immediate, avgBalance: 0 }, undefined, now)
    expect(Math.round(r.months[12].users)).toBe(15_498)
    expect(Math.round(r.months[12].cumRevenue)).toBe(1_072_897)
  })

  it('adds the $0.40/yr spread on top of other revenue', () => {
    const withSpread = simulate('custom', immediate, undefined, now)
    const without = simulate('custom', { ...immediate, avgBalance: 0 }, undefined, now)
    const nyUserMonths = withSpread.months.slice(1, 13).reduce((s, m) => s + m.nyUsers, 0)
    expect(withSpread.months[12].cumRevenue - without.months[12].cumRevenue).toBeCloseTo((nyUserMonths * 0.4) / 12, 6)
  })

  it('each month of delay costs about 315 users', () => {
    const at1 = simulate('custom', immediate, undefined, now)
    const at2 = simulate('custom', immediate, undefined, { ...now, full: { trigger: 'month', month: 2 } })
    expect(at1.months[1].users - at2.months[1].users).toBeCloseTo(315, 6)
  })

  it('cash falls by burn, plus the revenue gap, plus path cost', () => {
    const r = simulate('custom', D, undefined, { ...nothing, cost: 100_000 })
    const m1 = r.months[1]
    expect(m1.cash).toBeCloseTo(D.startingCash - D.monthlyBurn + (m1.revenue - 105_000) - 100_000, 6)
  })

  it('without new money every path runs out of cash within the horizon', () => {
    for (const id of NAMED_PATHS) expect(simulate(id, D).summary.outOfCashMonth).not.toBeNull()
  })
})

describe('strategy timing', () => {
  it('default launch months: wait 7, structure 2, sandbox pilot 5 then 11, foreign 9, mine pilot 5 then 7', () => {
    expect(simulate('wait', D).summary.launchMonth).toBe(7)
    expect(simulate('structure', D).summary.launchMonth).toBe(2)
    expect(simulate('sandbox', D).summary).toMatchObject({ pilotMonth: 5, launchMonth: 11 })
    expect(simulate('foreign', D).summary.launchMonth).toBe(9)
    expect(simulate('mine', D).summary).toMatchObject({ pilotMonth: 5, launchMonth: 7 })
  })

  it('the sandbox pilot is capped at 2,000 users', () => {
    const r = simulate('mine', D)
    expect(r.months[5].nyUsers).toBeLessThanOrEqual(2_000)
    expect(r.months[5].nyUsers).toBeGreaterThan(1_900)
  })

  it('a Cardinal delay pushes every launch back', () => {
    const a = applyScenario('cardinal')
    expect(simulate('structure', a).summary.launchMonth).toBe(6)
  })

  it('a refused non-objection means nothing launches', () => {
    const a = { ...D, nonObjectionRefused: true }
    for (const id of NAMED_PATHS) {
      const s = simulate(id, a).summary
      expect(s.launchMonth).toBeNull()
      expect(s.pilotMonth).toBeNull()
    }
  })

  it('participation 0 matches the no-Nest-Yield baseline', () => {
    const base = simulate('custom', D, undefined, nothing)
    const r = simulate('structure', { ...D, participation: 0 })
    expect(r.months[12].users).toBeCloseTo(base.months[12].users, 6)
  })

  it('custom builder respects its choices', () => {
    const c: CustomConfig = { pilotEnabled: true, pilotMonth: 3, pilotCap: 500, fullEnabled: false, fullTrigger: 'rules', fullMonth: 0, cost: 0 }
    const r = simulate('custom', D, c)
    expect(r.summary.pilotMonth).toBe(3)
    expect(r.summary.launchMonth).toBeNull()
    expect(r.months[3].nyUsers).toBeLessThanOrEqual(500)
  })
})

describe('scenarios', () => {
  it('rules landing differently unwinds paths that launched; Path 1 and 4 never launch', () => {
    const a = applyScenario('differently')
    const structure = simulate('structure', a)
    expect(structure.summary.unwound).toBe(true)
    const unwind = structure.events.find((e) => e.kind === 'unwind')!
    expect(unwind.month).toBe(7)
    expect(structure.months[7].nyUsers).toBe(0)
    expect(simulate('wait', a).summary).toMatchObject({ unwound: false, launchMonth: null })
    expect(simulate('foreign', a).summary).toMatchObject({ unwound: false, launchMonth: null })
  })

  it('an unwind loses 15% of Nest Yield users at once (half that under "My solution")', () => {
    const a = applyScenario('differently')
    const s = simulate('structure', a)
    const before = s.months[6].nyUsers
    const lostAt7 = s.months[7].cumLost - s.months[6].cumLost
    // 15% one-time loss + 5% churn on the remainder that month
    expect(lostAt7).toBeCloseTo(before * 0.15 + before * 0.85 * 0.05, 4)
    const m = simulate('mine', a)
    const noLoss = simulate('mine', { ...a, unwindLoss: 0 })
    const pilot = m.months[6].nyUsers
    expect(pilot).toBeLessThanOrEqual(2_000)
    const oneTime = (noLoss.months[7].users - m.months[7].users) / (1 - a.unwindChurn)
    expect(oneTime).toBeCloseTo(pilot * 0.15 * 0.5, 4)
  })

  it('"My solution" loses fewer users than Path 2 when rules land differently', () => {
    const a = applyScenario('differently')
    expect(simulate('mine', a).summary.usersAt24).toBeGreaterThan(simulate('structure', a).summary.usersAt24)
  })

  it('sandbox withdrawal unwinds the Path 3 pilot', () => {
    const r = simulate('sandbox', applyScenario('withdrawn'))
    expect(r.events.some((e) => e.kind === 'withdrawn')).toBe(true)
    expect(r.summary.unwound).toBe(true)
  })

  it('a sandbox that is not approved skips the pilot', () => {
    const r = simulate('mine', { ...D, sandboxApproved: false })
    expect(r.summary.pilotMonth).toBeNull()
    expect(r.summary.launchMonth).toBe(7)
  })

  it('a funding round adds cash in its month', () => {
    const r = simulate('wait', applyScenario('funding'))
    const base = simulate('wait', D)
    expect(r.months[6].cash - base.months[6].cash).toBeCloseTo(5_000_000, 4)
  })

  it('Paylo raises churn and loses more users', () => {
    expect(simulate('wait', applyScenario('paylo')).summary.usersAt12).toBeLessThan(simulate('wait', D).summary.usersAt12)
  })
})

describe('Monte Carlo and sensitivity', () => {
  it('is reproducible for a fixed seed and returns sane probabilities', () => {
    const a = monteCarlo('mine', D, 200, 42)
    const b = monteCarlo('mine', D, 200, 42)
    expect(a).toEqual(b)
    for (const p of [a.pOutOfCash, a.pOutOfCashBy12, a.pUnwind, a.pFullLaunch]) {
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
    expect(a.users12.p10).toBeLessThanOrEqual(a.users12.p50)
    expect(a.users12.p50).toBeLessThanOrEqual(a.users12.p90)
    expect(a.usersFan).toHaveLength(D.horizon + 1)
  })

  it('Path 2 is unwound far more often than "My solution" is hit at full scale', () => {
    const s = monteCarlo('structure', D, 500)
    const w = monteCarlo('wait', D, 500)
    expect(s.pUnwind).toBeGreaterThan(0.3)
    expect(w.pUnwind).toBe(0)
  })

  it('a $5M round in month 6 removes the month-12 cash-out, a $12M round survives 24 months', () => {
    const without = monteCarlo('mine', D, 300)
    const withFunding = monteCarlo('mine', { ...D, fundingEnabled: true }, 300)
    expect(without.pOutOfCashBy12).toBe(1)
    expect(withFunding.pOutOfCashBy12).toBe(0)
    expect(monteCarlo('mine', { ...D, fundingEnabled: true, fundingAmount: 12_000_000 }, 300).pOutOfCash).toBe(0)
  })

  it('tornado bars are sorted by swing', () => {
    const t = tornado('mine', D, 'users24')
    for (let i = 1; i < t.length; i++) expect(t[i - 1].swing).toBeGreaterThanOrEqual(t[i].swing)
  })
})

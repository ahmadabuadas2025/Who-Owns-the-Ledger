# Nest Yield decision simulator

An interactive dashboard for the FIT6050 Foundations of FinTech (Pillar 3) case **"Who Owns the Ledger?"**. Pick a strategy, press play,
and watch month by month how it changes users, cash and risk; compare all strategies side by side; stress-test them with "what if"
scenarios and 1,000-run Monte Carlo simulations.

> **The case is fictional and this is a class project, not financial or legal advice.** Stackline, Nestwise, Cardinal Bank & Trust,
> ClearTally and Paylo are invented; the case is loosely based on the 2024 Synapse collapse. The CFPB sandbox history is real.

## What it does

| View | What you get |
| --- | --- |
| **Simulator** | Strategy picker (four paths, "My solution", custom builder), scenario presets, a timeline player (play / pause / speed / scrubber), animated KPI tiles, users and cash charts with event markers, and an event log. |
| **Compare** | All strategies on the same users and cash charts (actual or "difference vs Path 1"), a results table, and the cost of one month of delay. |
| **Uncertainty** | 1,000 seeded Monte Carlo runs per strategy: chance of still having cash at months 12 and 24, chance of an unwind, fan charts, outcome ranges. |
| **Sensitivity** | Tornado chart: which input moves a chosen outcome most. |
| **Money flow** | Animated split of one user's $800: $30.40 a year → $28.00 rewards, $2.00 costs, $0.40 kept — and why retention, not the spread, is the prize. |
| **Ledger** | Animated "then vs now" diagram (Stackline as the only ledger → Cardinal + custodian + ClearTally), a Stackline-collapse button, and a ledger-of-record toggle (Cardinal vs ClearTally). |
| **Who says yes** | Which regulator decides each part of Nest Yield (the author's reading) and the CFPB sandbox timeline. |
| **Learn** | Glossary, formulas, the full assumption list and case figures. |

Every number is labelled **From the case**, **Assumption** or **Model result**. Finance terms have tooltips (dotted underline). There are
light/dark themes, a reduce-motion switch (defaults to the OS setting), a "Learn mode" for extra explanations, and an English/Arabic
toggle with right-to-left layout (the interface chrome and glossary terms are translated; longer explanatory text stays in English).

## Run it

```bash
npm ci
npm run dev       # http://localhost:5173
npm test          # Vitest: the simulation engine
npm run build     # static site in dist/
```

Pushing to `main` runs the tests, builds, and deploys to GitHub Pages via `.github/workflows/deploy.yml`. In the repository settings,
set **Pages → Source** to **GitHub Actions** once.

## Code layout

```
src/sim/            pure, tested simulation engine (no React)
  config.ts         ALL case data + default assumptions (typed, with provenance)
  economics.ts      unit economics: spread, lifetime value, cost of delay
  strategies.ts     the paths, "My solution", custom builder → concrete plans
  engine.ts         monthly simulation with events and flags
  scenarios.ts      one-click "what if" presets
  montecarlo.ts     seeded Monte Carlo (common random numbers across strategies)
  sensitivity.ts    one-at-a-time tornado analysis
src/views/          one file per dashboard view
src/components/     shared UI, controls and chart helpers
src/data/           glossary and regulatory tables
```

## The model

Monthly steps, default horizon 24 months. Month 0 is today (Sept 2026).

- **Revenue per user per month** = $60 / 12 = **$5**.
- **Nest Yield spread** per participating user per year = (3.8% − 3.5% − 0.25%) × $800 = **$0.40**.
- **Users next month** = users × (1 − churn); churn is **2.5%** for users with Nest Yield, **4.0%** for the rest. Each group is tracked
  separately.
- **Expected lifetime** = 1 / churn; **lifetime revenue** = $5 × lifetime.
- **Revenue this month** = end-of-month users × $5 + Nest Yield users × $0.40 / 12.
- **Cash next month** = cash − burn + (revenue this month − today's revenue) − path cost due this month + funding.
- **Runway** = cash / (burn − (revenue − today's revenue)).
- **Unwind**: a one-time loss of 15% of Nest Yield users, then 5% churn for those users for three months.

### Numbers the tests reproduce (`src/sim/*.test.ts`)

| Check | Value |
| --- | --- |
| Spread | $0.40 per user per year; ≈ $8,400 a year at 21,000 users |
| Lifetime | 25 months / $125 without; 40 months / $200 with; +$75 per user; $1,575,000 across 21,000 users |
| Users after 12 months | 12,867 without; 15,498 with (2,631 more, ≈ $118K to replace at $45) |
| Year-one revenue | $975,971 without; $1,072,897 with |
| Each month of delay | ≈ 315 extra users lost, ≈ $14,175 to replace, $63,000 of lifetime revenue |
| Money flow | $800 → $30.40 = $28.00 + $2.00 + $0.40 |

Plus behavioural tests for every strategy's timing, every scenario, the sandbox cap, unwinds, Cardinal delays/refusal, Monte Carlo
reproducibility and the tornado ordering.

### Strategies

| Strategy | Up-front | Pilot | Everyone gets Nest Yield |
| --- | --- | --- | --- |
| 1. Wait and comply | $0 (assumption for "minimal") | — | at the rules month (default 7) |
| 2. Structure around the gap | $150K | — | month 2, before the rules (exposed to an unwind) |
| 3. U.S. sandbox pilot | $200K | 2,000 users at the sandbox decision (default 5) | later of the rules month and pilot + 6 months |
| 4. Foreign sandbox / MiCA first | $400K | — | later of the rules month and the time abroad (default 9) |
| ★ My solution | $250K (assumption) | 2,000 users at the sandbox decision | at the rules month; unwind half as severe |
| Custom | you choose | optional, any size and month | at a fixed month or when rules land |

No launch can happen before Cardinal's regulatory non-objection.

## Assumptions (not in the case)

All adjustable in the **Inputs** panel and tagged "Assumption" in the UI.

| Assumption | Default |
| --- | --- |
| Starting cash | 9 × $650K = $5.85M; the $650K burn is already net of today's revenue |
| Nest Yield participation | 100% of eligible users |
| Launch month inside each path's range | midpoint: Path 2 month 2, sandbox decision month 5, rules month 7 (6.5 rounded up), Path 4 abroad 9 months |
| Cardinal's regulatory non-objection | month 2 (can be delayed or refused) |
| Final rules allow pass-through rewards | 60% (Monte Carlo); "yes" in the deterministic base case |
| Sandbox approved / later withdrawn | 70% / 10% (Monte Carlo); approved and kept in the base case; withdrawal hits 2 months into the pilot |
| Unwind | one-time loss of 15% of Nest Yield users; 5% churn for three months |
| "My solution" conservative legal design | halves the one-time unwind loss |
| "My solution" up-front cost | $250K (sandbox $200K + $50K legal) |
| Path 1 "minimal" cost | $0 |
| Funding event | off; $5M in month 6 when on |
| Monte Carlo: Cardinal non-objection slips 4 months | Wait 10%, Structure 35%, Sandbox 10%, Foreign 15%, Mine 10%, Custom 20% |
| Monte Carlo: participation | 75–100% of the input; launch months drawn uniformly within each path's range; rules month 4–9 |

### How the model reads the ambiguous parts

1. Revenue is counted on users still active at the end of each month (this is what reproduces the case's year-one revenue).
2. Up-front path costs are paid in month 1.
3. Path 1's launch month is the month final rules and issuer approval land.
4. Nothing goes live before Cardinal's non-objection; if it is refused, nothing launches in the U.S.
5. If the rules land differently, everything live is unwound at the rules month and Nest Yield does not relaunch within the horizon.
6. Path 3 alone needs a second approval to scale beyond 2,000 users.
7. If the sandbox is not approved, Path 3 and "My solution" skip the pilot and wait for the rules.
8. Users move into Nest Yield only at launch events; no paid acquisition is modelled.
9. The case's year-one revenue figures exclude the $0.40 spread; the simulator adds it.
10. Cardinal pays for its own $1.1M ledger system; the ledger-of-record choice does not change Nestwise's cash.

### What the model shows

With the case's numbers every path runs out of cash around month 9 without new money — the $650K burn is far larger than any
difference between paths, and the spread is tiny ($8,400 a year). The strategies differ in **how many users remain** and **how many
users an unwind would hit**: Path 2 keeps the most users if the rules land as hoped but is unwound in about a third of Monte Carlo runs
in front of all its users; "My solution" tracks Path 1's user numbers while limiting the blast radius of an unwind to the 2,000-user
pilot.

## Tech

Vite + React + TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Vitest. No backend.

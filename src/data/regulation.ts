/** CFPB sandbox / no-action letter history (real events). */
export const CFPB_TIMELINE = [
  { year: 2016, title: 'First no-action letter policy', detail: 'The CFPB sets up a way for firms to ask it not to take action over new products.', tone: 'neutral' as const },
  { year: 2017, title: 'First letter: Upstart', detail: 'Upstart, an AI lender, gets the first no-action letter.', tone: 'good' as const },
  { year: 2019, title: 'Programme expanded', detail: 'A broader sandbox; about 10 approvals, including PayActiv (early wage access).', tone: 'good' as const },
  { year: 2022, title: 'Approvals revoked, programme scrapped', detail: 'Upstart\'s and PayActiv\'s approvals are revoked and the programme ends under new leadership.', tone: 'bad' as const },
  { year: 2025, title: 'Reissued with stricter terms', detail: 'The policy returns, with tighter conditions.', tone: 'neutral' as const },
]

export type SandboxHelp = 'no' | 'mostly-no' | 'partly' | 'yes' | 'yes-but'

/** "Who has to say yes" — the student's own worksheet reading. */
export const WHO_SAYS_YES: { part: string; who: string; help: SandboxHelp; helpLabel: string; note?: string }[] = [
  { part: 'Stablecoin issuer and reserves', who: 'OCC / Treasury under the GENIUS Act (rules pending)', help: 'no', helpLabel: 'No' },
  { part: 'Custody', who: 'The custodian\'s own regulator', help: 'mostly-no', helpLabel: 'Mostly no' },
  { part: '"Rewards"', who: 'Grey area: issuers cannot pay interest; pass-through rewards unsettled', help: 'partly', helpLabel: 'Partly' },
  { part: 'What users are told', who: 'CFPB, FDIC, state attorneys general', help: 'yes', helpLabel: 'Yes' },
  { part: 'Early paycheck access', who: 'CFPB and states', help: 'yes-but', helpLabel: 'Yes, but…', note: 'PayActiv\'s approval was revoked' },
  { part: 'Cardinal accounts and the ledger', who: 'FDIC and state regulator, consent order', help: 'no', helpLabel: 'No' },
]

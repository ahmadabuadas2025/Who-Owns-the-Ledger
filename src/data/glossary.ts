export interface GlossaryEntry {
  id: string
  term: string
  termAr: string
  short: string
  example?: string
}

/** Plain-language definitions for every finance term the dashboard uses. */
export const GLOSSARY: GlossaryEntry[] = [
  { id: 'ledger', term: 'Ledger', termAr: 'دفتر الأستاذ', short: 'The record of who owns which dollars. If it is wrong or lost, nobody can prove what they are owed.', example: 'Stackline alone kept the ledger for about 400,000 users.' },
  { id: 'fbo', term: 'FBO account', termAr: 'حساب لصالح الغير (FBO)', short: '"For benefit of" account: one pooled bank account holding many people\'s money. The bank sees one total, not who owns each part.', example: 'The ledger said users were owed $148M; the FBO accounts held $121M.' },
  { id: 'middleware', term: 'Middleware', termAr: 'الوسيط التقني', short: 'A company that sits between apps and banks and connects them, handling accounts, cards and records.', example: 'Stackline was middleware between Nestwise and its partner banks.' },
  { id: 'spof', term: 'Single point of failure', termAr: 'نقطة فشل وحيدة', short: 'One part of a system that, if it breaks, takes everything down with it.', example: 'When Stackline failed, nobody else had the ledger.' },
  { id: 'fdic', term: 'FDIC insurance', termAr: 'تأمين FDIC', short: 'U.S. government protection up to $250,000 per depositor if a bank fails. It does not cover a failed fintech or middleware company.', example: 'Cardinal did not fail, so FDIC insurance did not apply.' },
  { id: 'interchange', term: 'Interchange', termAr: 'رسوم التبادل', short: 'A small fee a store pays each time a card is used; part of it goes to the card issuer and the app.', example: 'Interchange plus early-pay fees ≈ $60 per user per year.' },
  { id: 'churn', term: 'Churn', termAr: 'معدل التسرّب', short: 'The share of users who leave each month.', example: '4% churn means 4 out of every 100 users leave each month.' },
  { id: 'ltv', term: 'Lifetime value', termAr: 'القيمة الدائمة للعميل', short: 'How much revenue one user brings in before they leave. Here: monthly revenue × (1 ÷ churn).', example: '$5 a month × 25 months = $125.' },
  { id: 'cac', term: 'Acquisition cost', termAr: 'تكلفة اكتساب العميل', short: 'What it costs to win one new user (ads, referral bonuses, etc.).', example: 'About $45 per user for Nestwise.' },
  { id: 'burn', term: 'Burn', termAr: 'معدل الحرق', short: 'How much more money goes out each month than comes in.', example: 'Nestwise burns about $650K a month.' },
  { id: 'runway', term: 'Runway', termAr: 'المدة المتبقية للسيولة', short: 'How many months until the cash runs out at the current burn.', example: '$5.85M ÷ $650K = 9 months.' },
  { id: 'stablecoin', term: 'Stablecoin', termAr: 'العملة المستقرة', short: 'A digital token designed to always be worth $1, backed by cash and short-term government debt held in reserve.', example: 'Nest Yield balances are held in a U.S. dollar payment stablecoin.' },
  { id: 'issuer', term: 'Issuer', termAr: 'الجهة المُصدِرة', short: 'The company that creates the stablecoin and holds the reserves behind it.', example: 'Nest Yield\'s issuer is still waiting for federal approval.' },
  { id: 'reserves', term: 'Reserves', termAr: 'الاحتياطيات', short: 'The cash and safe assets an issuer holds so every token can be swapped back for $1. They earn interest.', example: 'Nestwise gets a share worth 3.8% of balances.' },
  { id: 'custodian', term: 'Custodian', termAr: 'أمين الحفظ', short: 'An outside firm that safely holds assets on behalf of their owners, separate from the app.', example: 'An outside custodian holds the Nest Yield balances.' },
  { id: 'spread', term: 'Spread', termAr: 'الهامش', short: 'What is left after paying everyone: income minus what is paid out and what it costs.', example: '3.8% − 3.5% − 0.25% = 0.05%, or $0.40 a year on $800.' },
  { id: 'consent', term: 'Consent order', termAr: 'أمر توافقي', short: 'A binding agreement with a regulator to fix problems, often with strict conditions.', example: 'Cardinal must reconcile every FBO account under its consent order.' },
  { id: 'nonobjection', term: 'Non-objection', termAr: 'عدم الممانعة', short: 'A regulator formally saying it does not object to a planned step. Not an approval, but required before going ahead.', example: 'Cardinal needs regulators\' non-objection before any new fintech partner.' },
  { id: 'sandbox', term: 'Sandbox', termAr: 'البيئة التجريبية التنظيمية', short: 'A regulator programme that lets a company test a new product on a small group under supervision and relaxed rules.', example: 'Path 3 pilots Nest Yield with up to 2,000 users.' },
  { id: 'nal', term: 'No-action letter', termAr: 'خطاب عدم اتخاذ إجراء', short: 'A letter in which a regulator says it will not take enforcement action over a specific product. It can be withdrawn.', example: 'The CFPB revoked Upstart\'s and PayActiv\'s letters in 2022.' },
  { id: 'unwind', term: 'Unwind', termAr: 'التصفية / الإلغاء', short: 'Shutting a product down and moving users\' money back, usually because it is no longer allowed.', example: 'Modelled as losing 15% of affected users at once.' },
  { id: 'reconciliation', term: 'Reconciliation', termAr: 'المطابقة', short: 'Checking that two sets of records agree, and fixing differences.', example: 'ClearTally matches the app, its own records and Cardinal\'s accounts every night.' },
  { id: 'montecarlo', term: 'Monte Carlo', termAr: 'محاكاة مونت كارلو', short: 'Running the same model many times with random draws for uncertain inputs, to see the range of outcomes.', example: '1,000 runs per strategy.' },
]

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map((g) => [g.id, g])) as Record<string, GlossaryEntry>

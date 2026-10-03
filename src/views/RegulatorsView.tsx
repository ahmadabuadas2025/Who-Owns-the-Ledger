import { motion } from 'framer-motion'
import { Card, SourceTag, Term } from '../components/ui'
import { CFPB_TIMELINE, WHO_SAYS_YES } from '../data/regulation'
import type { SandboxHelp } from '../data/regulation'
import { useApp } from '../lib/state'

const HELP_STYLE: Record<SandboxHelp, { icon: string; bg: string }> = {
  no: { icon: '✕', bg: 'var(--critical)' },
  'mostly-no': { icon: '✕', bg: 'var(--serious)' },
  partly: { icon: '◐', bg: 'var(--muted)' },
  yes: { icon: '✓', bg: 'var(--good)' },
  'yes-but': { icon: '!', bg: 'var(--good)' },
}

export function RegulatorsView() {
  const { reduceMotion } = useApp()
  return (
    <div className="space-y-4">
      <Card
        title="Who has to say yes"
        subtitle="Each part of Nest Yield answers to a different regulator. A sandbox only helps where its regulator is the one deciding."
        actions={
          <span className="inline-flex items-center gap-2 text-xs text-ink-2">
            My reading (worksheet answers) <SourceTag source="assumption" />
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WHO_SAYS_YES.map((r, i) => {
            const s = HELP_STYLE[r.help]
            return (
              <motion.div
                key={r.part}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col rounded-xl border border-line bg-surface p-3"
              >
                <div className="text-sm font-semibold text-ink">{r.part}</div>
                <div className="mt-1 flex-1 text-sm text-ink-2">{r.who}</div>
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-2 text-sm">
                  <span className="text-xs text-muted">Does a <Term id="sandbox">sandbox</Term> help?</span>
                  <span className="ms-auto inline-flex items-center gap-1.5 font-semibold text-ink">
                    <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: s.bg }}>
                      {s.icon}
                    </span>
                    {r.helpLabel}
                  </span>
                </div>
                {r.note && <div className="mt-1 text-xs text-muted">{r.note}</div>}
              </motion.div>
            )
          })}
        </div>
        <p className="mt-4 text-sm text-ink-2">
          <strong className="text-ink">Takeaway:</strong> the parts a sandbox can cover (disclosures, early pay) are not the parts that decide the
          launch (issuer approval, reward rules, Cardinal&apos;s <Term id="consent">consent order</Term>). That is why &ldquo;My solution&rdquo;
          uses the sandbox for a small pilot and waits for final rules to scale.
        </p>
      </Card>

      <Card
        title="CFPB sandbox history"
        subtitle="Real events. Lesson: sandbox relief can be withdrawn."
        actions={<span className="text-xs text-ink-2">Public record</span>}
      >
        <ol className="relative ms-3 border-s-2 border-line">
          {CFPB_TIMELINE.map((e, i) => (
            <motion.li
              key={e.year}
              className="relative mb-5 ps-6 last:mb-0"
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <span
                aria-hidden
                className="absolute -start-[11px] top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: e.tone === 'bad' ? 'var(--critical)' : e.tone === 'good' ? 'var(--good)' : 'var(--muted)' }}
              >
                {e.tone === 'bad' ? '✕' : e.tone === 'good' ? '✓' : '•'}
              </span>
              <div className="tabular text-sm font-bold text-ink">{e.year}</div>
              <div className="text-sm font-semibold text-ink">{e.title}</div>
              <div className="text-sm text-ink-2">{e.detail}</div>
            </motion.li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-2">
          A <Term id="nal">no-action letter</Term> is not a law change. Upstart and PayActiv built on theirs and lost them in 2022. The simulator
          models this as a chance the sandbox is withdrawn (default 10%), which forces the pilot to <Term id="unwind">unwind</Term>.
        </p>
      </Card>
    </div>
  )
}

/** Formatting helpers. Numbers always use Western digits so charts and tables line up. */
const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function users(n: number): string {
  return nf0.format(Math.round(n))
}

export function money(n: number, opts: { compact?: boolean; cents?: boolean } = {}): string {
  const sign = n < 0 ? '−' : ''
  const v = Math.abs(n)
  if (opts.cents) return `${sign}$${v.toFixed(2)}`
  if (opts.compact) {
    if (v >= 1e9) return `${sign}$${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)}B`
    if (v >= 1e6) return `${sign}$${(v / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`
    if (v >= 1e3) return `${sign}$${Math.round(v / 1e3)}K`
  }
  return `${sign}$${nf0.format(Math.round(v))}`
}

export function pct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`
}

export function months(n: number): string {
  if (!Number.isFinite(n)) return '∞'
  return n >= 10 ? Math.round(n).toString() : n.toFixed(1)
}

/** Round axis ticks: about `count` steps of 1, 2, 2.5 or 5 × 10^n covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (hi === lo) hi = lo + 1
  const raw = (hi - lo) / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const start = Math.floor(lo / step) * step
  const ticks: number[] = []
  for (let v = start; v < hi + step * 0.999; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  return ticks
}

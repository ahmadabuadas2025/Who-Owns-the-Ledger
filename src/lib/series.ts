import type { PathId } from '../sim'

/** Fixed categorical slot per strategy. Colour follows the entity, never its rank. */
export const SERIES_COLOR: Record<PathId, string> = {
  mine: 'var(--s-mine)',
  wait: 'var(--s-wait)',
  structure: 'var(--s-structure)',
  sandbox: 'var(--s-sandbox)',
  foreign: 'var(--s-foreign)',
  custom: 'var(--s-custom)',
}

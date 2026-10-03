import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Assumptions, CustomConfig, PathId } from '../sim'
import { DEFAULT_ASSUMPTIONS, DEFAULT_CUSTOM, SCENARIOS, STRATEGY_BY_ID } from '../sim'
import type { Lang, StringKey } from './i18n'
import { STRATEGY_NAME_AR, STRINGS } from './i18n'

type Theme = 'light' | 'dark'

interface AppState {
  assumptions: Assumptions
  setAssumption: <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => void
  resetAssumptions: () => void
  scenarioId: string | null
  applyScenario: (id: string | null) => void
  pathId: PathId
  setPathId: (id: PathId) => void
  custom: CustomConfig
  setCustom: (c: CustomConfig) => void
  theme: Theme
  setTheme: (t: Theme) => void
  lang: Lang
  setLang: (l: Lang) => void
  reduceMotion: boolean
  setReduceMotion: (v: boolean) => void
  learnMode: boolean
  setLearnMode: (v: boolean) => void
  inputsOpen: boolean
  setInputsOpen: (v: boolean) => void
  t: (k: StringKey) => string
  strategyName: (id: PathId) => string
}

const Ctx = createContext<AppState | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : (JSON.parse(v) as T)
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: preferences just won't persist */
  }
}

const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
const systemReduced = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function AppProvider({ children }: { children: ReactNode }) {
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS)
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [pathId, setPathId] = useState<PathId>('mine')
  const [custom, setCustom] = useState<CustomConfig>(DEFAULT_CUSTOM)
  const [theme, setThemeState] = useState<Theme>(() => load<Theme>('ny.theme', systemDark() ? 'dark' : 'light'))
  const [lang, setLangState] = useState<Lang>(() => load<Lang>('ny.lang', 'en'))
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => load('ny.reduceMotion', systemReduced()))
  const [learnMode, setLearnModeState] = useState<boolean>(() => load('ny.learn', true))
  const [inputsOpen, setInputsOpen] = useState(false)

  useEffect(() => {
    const el = document.documentElement
    el.dataset.theme = theme
    el.dataset.motion = reduceMotion ? 'reduced' : 'full'
    el.lang = lang
    el.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [theme, reduceMotion, lang])

  const setAssumption = useCallback(<K extends keyof Assumptions>(key: K, value: Assumptions[K]) => {
    setAssumptions((a) => ({ ...a, [key]: value }))
    setScenarioId(null)
  }, [])

  const applyScenario = useCallback((id: string | null) => {
    const s = SCENARIOS.find((x) => x.id === id)
    setAssumptions({ ...DEFAULT_ASSUMPTIONS, ...(s?.changes ?? {}) })
    setScenarioId(s ? s.id : null)
  }, [])

  const value = useMemo<AppState>(
    () => ({
      assumptions,
      setAssumption,
      resetAssumptions: () => applyScenario(null),
      scenarioId,
      applyScenario,
      pathId,
      setPathId,
      custom,
      setCustom,
      theme,
      setTheme: (t) => {
        setThemeState(t)
        save('ny.theme', t)
      },
      lang,
      setLang: (l) => {
        setLangState(l)
        save('ny.lang', l)
      },
      reduceMotion,
      setReduceMotion: (v) => {
        setReduceMotionState(v)
        save('ny.reduceMotion', v)
      },
      learnMode,
      setLearnMode: (v) => {
        setLearnModeState(v)
        save('ny.learn', v)
      },
      inputsOpen,
      setInputsOpen,
      t: (k) => STRINGS[lang][k],
      strategyName: (id) => (lang === 'ar' ? STRATEGY_NAME_AR[id] : STRATEGY_BY_ID[id].name),
    }),
    [assumptions, setAssumption, applyScenario, scenarioId, pathId, custom, theme, lang, reduceMotion, learnMode, inputsOpen],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside AppProvider')
  return v
}

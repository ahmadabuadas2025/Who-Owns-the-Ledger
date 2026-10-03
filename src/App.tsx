import { MotionConfig } from 'framer-motion'
import { useState } from 'react'
import { AssumptionsDrawer } from './components/controls'
import { Switch } from './components/ui'
import type { StringKey } from './lib/i18n'
import { AppProvider, useApp } from './lib/state'
import { CompareView } from './views/CompareView'
import { SimulatorView } from './views/SimulatorView'

type Tab = 'sim' | 'compare' | 'uncertainty' | 'sensitivity' | 'money' | 'ledger' | 'regulators' | 'learn'
const TABS: Tab[] = ['sim', 'compare', 'uncertainty', 'sensitivity', 'money', 'ledger', 'regulators', 'learn']

function Shell() {
  const { t, theme, setTheme, lang, setLang, reduceMotion, setReduceMotion, learnMode, setLearnMode, setInputsOpen } = useApp()
  const [tab, setTab] = useState<Tab>('sim')
  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{t('appTitle')}</h1>
              <p className="text-sm text-ink-2">{t('appSubtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => setInputsOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-white"
              >
                <span aria-hidden>⚙</span>
                {t('inputs')}
              </button>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 rounded-lg border border-line px-3 text-sm text-ink-2 hover:text-ink"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                <span aria-hidden>{theme === 'dark' ? '☀ ' : '☾ '}</span>
                {theme === 'dark' ? t('theme_light') : t('theme_dark')}
              </button>
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="h-9 rounded-lg border border-line px-3 text-sm text-ink-2 hover:text-ink"
                lang={lang === 'en' ? 'ar' : 'en'}
              >
                {t('language')}
              </button>
              <Switch checked={reduceMotion} onChange={setReduceMotion} label={t('motion_reduce')} />
              <Switch checked={learnMode} onChange={setLearnMode} label={t('learnMode')} />
            </div>
          </div>
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-ink-2">
            <span aria-hidden className="font-bold">ⓘ</span>
            {t('disclaimer')}
          </p>
          <nav className="-mx-4 mt-3 overflow-x-auto px-4" aria-label="Views">
            <div role="tablist" className="flex gap-1">
              {TABS.map((id) => (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={tab === id}
                  aria-controls="main"
                  onClick={() => setTab(id)}
                  className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    tab === id ? 'border-accent text-ink' : 'border-transparent text-ink-2 hover:text-ink'
                  }`}
                >
                  {t(`nav_${id}` as StringKey)}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>
      <main id="main" role="tabpanel" className="mx-auto max-w-7xl px-4 py-5">
        {tab === 'sim' && <SimulatorView />}
        {tab === 'compare' && <CompareView />}
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted">
        Built for FIT6050. Stackline, Nestwise, Cardinal, ClearTally and Paylo are fictional; the case is loosely based on the 2024
        Synapse collapse. The CFPB sandbox history is real. Not financial advice.
      </footer>
      <AssumptionsDrawer />
    </MotionConfig>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

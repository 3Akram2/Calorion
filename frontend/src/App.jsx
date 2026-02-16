import { useMemo } from 'react'
import './App.css'
import { usePersistentState } from './hooks/usePersistentState'
import en from './locales/en.json'
import ar from './locales/ar.json'

const copy = {
  en,
  ar,
}

function App() {
  const [theme, setTheme] = usePersistentState('theme', 'light')
  const [lang, setLang] = usePersistentState('lang', 'en')

  const t = useMemo(() => copy[lang] || copy.en, [lang])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ar' : 'en')
  }

  return (
    <main className={`app ${theme}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="topbar">
        <div className="chip">
          {t.mode}: <strong>{theme === 'light' ? t.light : t.dark}</strong>
        </div>
        <button onClick={toggleTheme}>{theme === 'light' ? t.dark : t.light}</button>
        <button onClick={toggleLang}>{lang === 'en' ? t.arabic : t.english}</button>
      </header>

      <section className="hero">
        <h1>{t.title}</h1>
        <h2>{t.subtitle}</h2>
        <p>{t.description}</p>
        <div className="badge">{t.cta}</div>
      </section>
    </main>
  )
}

export default App

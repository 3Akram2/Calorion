import { useMemo, useState } from 'react'
import './App.css'

const copy = {
  en: {
    title: 'Calorion',
    subtitle: 'Your AI diet partner',
    description:
      'Mobile-first nutrition planning with personalized calories, weekly plans, and daily check-ins.',
    cta: 'Phase 1 Foundation Ready',
    mode: 'Mode',
    lang: 'Language',
    light: 'Light',
    dark: 'Dark',
    english: 'English',
    arabic: 'Arabic',
  },
  ar: {
    title: 'كالوريون',
    subtitle: 'شريكك الذكي للنظام الغذائي',
    description:
      'تخطيط غذائي مخصص للهاتف أولاً مع سعرات شخصية وخطط أسبوعية وتسجيل يومي.',
    cta: 'المرحلة الأولى جاهزة',
    mode: 'الوضع',
    lang: 'اللغة',
    light: 'فاتح',
    dark: 'داكن',
    english: 'English',
    arabic: 'العربية',
  },
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en')

  const t = useMemo(() => copy[lang], [lang])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  const toggleLang = () => {
    const next = lang === 'en' ? 'ar' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
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

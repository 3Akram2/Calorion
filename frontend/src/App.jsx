import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import { usePersistentState } from './hooks/usePersistentState'
import en from './locales/en.json'
import ar from './locales/ar.json'

const copy = { en, ar }

function DashboardPage({ t }) {
  return (
    <section className="card">
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
      <p>{t.description}</p>
    </section>
  )
}

function OnboardingPage({ t }) {
  const [profile, setProfile] = usePersistentState('profile', JSON.stringify({
    country: '',
    cuisines: '',
    heightCm: '',
    currentWeightKg: '',
    targetWeightKg: '',
    goal: 'small-loss',
  }))

  const data = JSON.parse(profile)

  const setField = (key, value) => {
    setProfile(JSON.stringify({ ...data, [key]: value }))
  }

  return (
    <section className="card">
      <h2>{t.onboarding}</h2>
      <div className="grid">
        <label>{t.country}<input value={data.country} onChange={(e) => setField('country', e.target.value)} /></label>
        <label>{t.cuisines}<input value={data.cuisines} onChange={(e) => setField('cuisines', e.target.value)} /></label>
        <label>{t.height}<input type="number" value={data.heightCm} onChange={(e) => setField('heightCm', e.target.value)} /></label>
        <label>{t.currentWeight}<input type="number" value={data.currentWeightKg} onChange={(e) => setField('currentWeightKg', e.target.value)} /></label>
        <label>{t.targetWeight}<input type="number" value={data.targetWeightKg} onChange={(e) => setField('targetWeightKg', e.target.value)} /></label>
        <label>{t.goal}
          <select value={data.goal} onChange={(e) => setField('goal', e.target.value)}>
            <option value="big-loss">{t.bigLoss}</option>
            <option value="small-loss">{t.smallLoss}</option>
            <option value="maintain">{t.maintain}</option>
          </select>
        </label>
      </div>
    </section>
  )
}

function WeeklyPlanPage({ t }) {
  const meals = [
    { name: t.breakfast, calories: 450 },
    { name: t.lunch, calories: 700 },
    { name: t.dinner, calories: 600 },
    { name: t.snack, calories: 250 },
  ]
  const total = meals.reduce((sum, m) => sum + m.calories, 0)

  return (
    <section className="card">
      <h2>{t.weeklyPlan}</h2>
      <ul className="list">
        {meals.map((m) => (
          <li key={m.name}><span>{m.name}</span><strong>{m.calories} kcal</strong></li>
        ))}
      </ul>
      <p><strong>{t.totalCalories}:</strong> {total} kcal</p>
    </section>
  )
}

function DailyLogPage({ t }) {
  const [consumed, setConsumed] = usePersistentState('daily-consumed', '0')
  const [burned, setBurned] = usePersistentState('daily-burned', '0')
  const [limit, setLimit] = usePersistentState('daily-limit', '2000')

  const consumedN = Number(consumed || 0)
  const burnedN = Number(burned || 0)
  const limitN = Number(limit || 0)
  const net = consumedN - burnedN
  const overUnder = consumedN - limitN

  return (
    <section className="card">
      <h2>{t.dailyLog}</h2>
      <div className="grid">
        <label>{t.caloriesConsumed}<input type="number" value={consumed} onChange={(e) => setConsumed(e.target.value)} /></label>
        <label>{t.caloriesBurned}<input type="number" value={burned} onChange={(e) => setBurned(e.target.value)} /></label>
        <label>{t.dailyLimit}<input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} /></label>
      </div>
      <p><strong>{t.netCalories}:</strong> {net} kcal</p>
      <p><strong>{t.overUnder}:</strong> {overUnder > 0 ? `+${overUnder}` : overUnder} kcal</p>
    </section>
  )
}

function AiChatPage({ t }) {
  return (
    <section className="card">
      <h2>{t.aiChat}</h2>
      <p>{t.aiPlaceholder}</p>
    </section>
  )
}

function SettingsPage({ t, theme, setTheme, lang, setLang }) {
  return (
    <section className="card">
      <h2>{t.settings}</h2>
      <div className="row">
        <span>{t.mode}</span>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? t.dark : t.light}</button>
      </div>
      <div className="row">
        <span>{t.language}</span>
        <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{lang === 'en' ? t.arabic : t.english}</button>
      </div>
    </section>
  )
}

function App() {
  const [theme, setTheme] = usePersistentState('theme', 'light')
  const [lang, setLang] = usePersistentState('lang', 'en')
  const t = copy[lang] || copy.en

  const navItems = [
    { to: '/', label: t.dashboard, end: true },
    { to: '/onboarding', label: t.onboarding },
    { to: '/weekly-plan', label: t.weeklyPlan },
    { to: '/daily-log', label: t.dailyLog },
    { to: '/ai-chat', label: t.aiChat },
    { to: '/settings', label: t.settings },
  ]

  return (
    <main className={`app ${theme}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <aside className="sidebar">
        <h2 className="brand">Calorion</h2>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="menu-controls">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{t.mode}: {theme === 'light' ? t.light : t.dark}</button>
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t.language}: {lang === 'en' ? t.english : t.arabic}</button>
        </div>
      </aside>

      <section className="content">
        <Routes>
          <Route path="/" element={<DashboardPage t={t} />} />
          <Route path="/onboarding" element={<OnboardingPage t={t} />} />
          <Route path="/weekly-plan" element={<WeeklyPlanPage t={t} />} />
          <Route path="/daily-log" element={<DailyLogPage t={t} />} />
          <Route path="/ai-chat" element={<AiChatPage t={t} />} />
          <Route path="/settings" element={<SettingsPage t={t} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} />} />
        </Routes>
      </section>
    </main>
  )
}

export default App

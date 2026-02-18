import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import { apiGet, apiPost } from './api'
import { usePersistentState } from './hooks/usePersistentState'
import en from './locales/en.json'
import ar from './locales/ar.json'

const copy = { en, ar }

function Menu({ t, theme, setTheme, lang, setLang }) {
  const items = [
    { to: '/', label: t.dashboard, end: true },
    { to: '/profile', label: t.profile },
    { to: '/weekly-plan', label: t.weeklyPlan },
    { to: '/daily-log', label: t.dailyLog },
    { to: '/ai-chat', label: t.aiChat },
    { to: '/admin', label: t.adminDashboard },
  ]

  return (
    <aside className="sidebar">
      <div className="brand-wrap">
        <h2 className="brand">Calorion</h2>
      </div>
      <nav>
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {i.label}
          </NavLink>
        ))}
      </nav>
      <div className="menu-controls">
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {t.mode}: {theme === 'light' ? t.light : t.dark}
        </button>
        <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
          {t.language}: {lang === 'en' ? t.english : t.arabic}
        </button>
      </div>
    </aside>
  )
}

function OnboardingWizard({ t, onDone, email, setEmail }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    country: '',
    cuisines: '',
    heightCm: '',
    currentWeightKg: '',
    targetWeightKg: '',
    goal: 'small-loss',
    activityLevel: 'moderate',
  })

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }))

  const finish = async () => {
    const payload = {
      ...form,
      email,
      cuisines: form.cuisines
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      heightCm: Number(form.heightCm || 0),
      currentWeightKg: Number(form.currentWeightKg || 0),
      targetWeightKg: Number(form.targetWeightKg || 0),
    }
    await apiPost('/api/users/profile', payload)
    onDone()
  }

  return (
    <section className="card onboarding-card">
      <div className="step">{t.step} {step}/4</div>

      {step === 1 && (
        <>
          <h2>{t.welcome}</h2>
          <label>{t.email}<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>{t.name}<input value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
        </>
      )}

      {step === 2 && (
        <>
          <h2>{t.bodyMetrics}</h2>
          <label>{t.height}<input type="number" value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} /></label>
          <label>{t.currentWeight}<input type="number" value={form.currentWeightKg} onChange={(e) => update('currentWeightKg', e.target.value)} /></label>
          <label>{t.targetWeight}<input type="number" value={form.targetWeightKg} onChange={(e) => update('targetWeightKg', e.target.value)} /></label>
        </>
      )}

      {step === 3 && (
        <>
          <h2>{t.personalization}</h2>
          <label>{t.country}<input value={form.country} onChange={(e) => update('country', e.target.value)} /></label>
          <label>{t.cuisines}<input value={form.cuisines} onChange={(e) => update('cuisines', e.target.value)} /></label>
          <label>{t.goal}
            <select value={form.goal} onChange={(e) => update('goal', e.target.value)}>
              <option value="big-loss">{t.bigLoss}</option>
              <option value="small-loss">{t.smallLoss}</option>
              <option value="maintain">{t.maintain}</option>
            </select>
          </label>
        </>
      )}

      {step === 4 && (
        <>
          <h2>{t.activity}</h2>
          <label>{t.activityLevel}
            <select value={form.activityLevel} onChange={(e) => update('activityLevel', e.target.value)}>
              <option value="low">{t.low}</option>
              <option value="moderate">{t.moderate}</option>
              <option value="high">{t.high}</option>
            </select>
          </label>
          <p>{t.readyToStart}</p>
        </>
      )}

      <div className="wizard-actions">
        {step > 1 ? <button onClick={() => setStep((s) => s - 1)}>{t.back}</button> : <span />}
        {step < 4 ? <button onClick={() => setStep((s) => s + 1)}>{t.next}</button> : <button onClick={finish}>{t.finish}</button>}
      </div>
    </section>
  )
}

function DashboardPage({ t, profile }) {
  return (
    <section className="card">
      <h1>{t.dashboard}</h1>
      <p>{t.dailyTarget}: <strong>{profile?.dailyCaloriesTarget || 0} kcal</strong></p>
      <p>{t.subtitle}</p>
    </section>
  )
}

function ProfilePage({ t, profile }) {
  if (!profile) return <section className="card">{t.loading}</section>
  return (
    <section className="card">
      <h2>{t.profile}</h2>
      <div className="grid two">
        <div><strong>{t.name}:</strong> {profile.name}</div>
        <div><strong>{t.email}:</strong> {profile.email}</div>
        <div><strong>{t.country}:</strong> {profile.country}</div>
        <div><strong>{t.goal}:</strong> {profile.goal}</div>
        <div><strong>{t.currentWeight}:</strong> {profile.currentWeightKg}</div>
        <div><strong>{t.targetWeight}:</strong> {profile.targetWeightKg}</div>
      </div>
    </section>
  )
}

function WeeklyPlanPage({ t, profile }) {
  const target = profile?.dailyCaloriesTarget || 2000
  const meals = useMemo(() => [
    { name: t.breakfast, calories: Math.round(target * 0.28) },
    { name: t.lunch, calories: Math.round(target * 0.34) },
    { name: t.dinner, calories: Math.round(target * 0.28) },
    { name: t.snack, calories: Math.round(target * 0.1) },
  ], [t, target])

  return (
    <section className="card">
      <h2>{t.weeklyPlan}</h2>
      <ul className="list">{meals.map((m) => <li key={m.name}><span>{m.name}</span><strong>{m.calories} kcal</strong></li>)}</ul>
      <p><strong>{t.totalCalories}:</strong> {target} kcal</p>
    </section>
  )
}

function DailyLogPage({ t, profile }) {
  const [consumed, setConsumed] = useState('0')
  const [burned, setBurned] = useState('0')
  const limit = profile?.dailyCaloriesTarget || 0
  const overUnder = Number(consumed || 0) - limit

  return (
    <section className="card">
      <h2>{t.dailyLog}</h2>
      <div className="grid two">
        <label>{t.caloriesConsumed}<input type="number" value={consumed} onChange={(e) => setConsumed(e.target.value)} /></label>
        <label>{t.caloriesBurned}<input type="number" value={burned} onChange={(e) => setBurned(e.target.value)} /></label>
      </div>
      <p><strong>{t.dailyLimit}:</strong> {limit} kcal</p>
      <p><strong>{t.netCalories}:</strong> {Number(consumed || 0) - Number(burned || 0)} kcal</p>
      <p><strong>{t.overUnder}:</strong> {overUnder > 0 ? `+${overUnder}` : overUnder} kcal</p>
    </section>
  )
}

function AiChatPage({ t, email }) {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])

  const send = async () => {
    if (!text.trim()) return
    const chat = await apiPost('/api/chats/message', { email, content: text })
    setMessages(chat.messages || [])
    setText('')
  }

  return (
    <section className="card">
      <h2>{t.aiChat}</h2>
      <div className="chat-box">
        {messages.length === 0 && <p>{t.aiPlaceholder}</p>}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>{m.content}</div>
        ))}
      </div>
      <div className="chat-input">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t.chatInputPlaceholder} />
        <button onClick={send}>{t.send}</button>
      </div>
    </section>
  )
}

function AdminDashboardPage({ t }) {
  const [metrics, setMetrics] = useState(null)
  const [users, setUsers] = useState([])
  const [chats, setChats] = useState([])

  useEffect(() => {
    Promise.all([apiGet('/api/admin/metrics'), apiGet('/api/admin/users'), apiGet('/api/admin/chats')])
      .then(([m, u, c]) => {
        setMetrics(m)
        setUsers(u)
        setChats(c)
      })
      .catch(() => {
        setMetrics({ totalUsers: 0, totalChats: 0, totalMessages: 0, newUsers7d: 0 })
      })
  }, [])

  return (
    <section className="card">
      <h2>{t.adminDashboard}</h2>
      <div className="metrics-grid">
        <div className="metric"><span>{t.totalUsers}</span><strong>{metrics?.totalUsers ?? '-'}</strong></div>
        <div className="metric"><span>{t.totalChats}</span><strong>{metrics?.totalChats ?? '-'}</strong></div>
        <div className="metric"><span>{t.totalMessages}</span><strong>{metrics?.totalMessages ?? '-'}</strong></div>
        <div className="metric"><span>{t.newUsers7d}</span><strong>{metrics?.newUsers7d ?? '-'}</strong></div>
      </div>

      <h3>{t.usersList}</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>{t.name}</th><th>{t.email}</th><th>{t.goal}</th><th>{t.country}</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.goal}</td><td>{u.country}</td></tr>)}</tbody>
        </table>
      </div>

      <h3>{t.chatsList}</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>{t.chatTitle}</th><th>{t.messagesCount}</th><th>{t.lastUpdate}</th></tr></thead>
          <tbody>{chats.map((c) => <tr key={c._id}><td>{c.title}</td><td>{c.messages?.length || 0}</td><td>{new Date(c.updatedAt).toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  )
}

function App() {
  const [theme, setTheme] = usePersistentState('theme', 'light')
  const [lang, setLang] = usePersistentState('lang', 'en')
  const [email, setEmail] = usePersistentState('current-email', 'demo@calorion.app')
  const [onboardingDone, setOnboardingDone] = usePersistentState('onboarding-done', 'false')
  const [profile, setProfile] = useState(null)

  const t = useMemo(() => copy[lang] || copy.en, [lang])
  const navigate = useNavigate()

  const loadProfile = useCallback(async () => {
    if (!email) return
    try {
      const p = await apiGet(`/api/users/profile?email=${encodeURIComponent(email)}`)
      setProfile(p)
    } catch {
      setProfile(null)
    }
  }, [email])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (onboardingDone !== 'true') navigate('/onboarding')
  }, [onboardingDone, navigate])

  const finishOnboarding = async () => {
    setOnboardingDone('true')
    await loadProfile()
    navigate('/')
  }

  return (
    <main className={`app ${theme}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Menu t={t} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} />

      <section className="content">
        <Routes>
          <Route path="/" element={onboardingDone !== 'true' ? <Navigate to="/onboarding" /> : <DashboardPage t={t} profile={profile} />} />
          <Route path="/onboarding" element={<OnboardingWizard t={t} onDone={finishOnboarding} email={email} setEmail={setEmail} />} />
          <Route path="/profile" element={<ProfilePage t={t} profile={profile} />} />
          <Route path="/weekly-plan" element={<WeeklyPlanPage t={t} profile={profile} />} />
          <Route path="/daily-log" element={<DailyLogPage t={t} profile={profile} />} />
          <Route path="/ai-chat" element={<AiChatPage t={t} email={email} />} />
          <Route path="/admin" element={<AdminDashboardPage t={t} />} />
        </Routes>
      </section>
    </main>
  )
}

export default App

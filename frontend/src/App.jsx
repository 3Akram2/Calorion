import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import './App.css'
import { apiDelete, apiGet, apiPost } from './api'
import { auth, googleProvider, startPhoneSignIn } from './firebase'
import { usePersistentState } from './hooks/usePersistentState'
import en from './locales/en.json'
import ar from './locales/ar.json'

const copy = { en, ar }

function AuthPage({ t, onAuthenticated }) {
  const [method, setMethod] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const finish = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken()
    localStorage.setItem('firebase-id-token', idToken)
    const res = await apiPost('/api/auth/firebase-login', { idToken })
    onAuthenticated(res.user)
  }

  const submitGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      await finish(cred.user)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const sendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await startPhoneSignIn(phone)
      setConfirmationResult(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const cred = await confirmationResult.confirm(otp)
      await finish(cred.user)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-wrap auth-dark">
      <div className="auth-card modern">
        <div className="auth-head">
          <h1>Create your Calorion account</h1>
        </div>

        {method === 'phone' && (
          <>
            <label>{t.phone}
              <div className="input-with-icon">
                <span className="phone-mark" aria-hidden="true">📱</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2010..." />
              </div>
            </label>
            {!confirmationResult ? (
              <button className="primary-btn" onClick={sendOtp} disabled={loading || !phone}>{loading ? '...' : t.sendOtp}</button>
            ) : (
              <>
                <label>{t.otp}<input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" /></label>
                <button className="primary-btn" onClick={verifyOtp} disabled={loading || !otp}>{loading ? '...' : t.verifyOtp}</button>
              </>
            )}
          </>
        )}

        <div className="divider"><span>OR</span></div>

        <button className="ghost-btn google-btn" onClick={submitGoogle} disabled={loading}>
          <span className="google-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" role="img" aria-label="Google">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.2H12z"/>
              <path fill="#34A853" d="M3.8 7.3l3.2 2.3c.9-2 2.8-3.4 5-3.4 1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3c-3.6 0-6.7 2-8.2 5z"/>
              <path fill="#FBBC05" d="M12 20.7c2.5 0 4.6-.8 6.2-2.3l-3-2.4c-.8.6-1.9 1.1-3.2 1.1-2.8 0-5.1-1.9-5.9-4.4l-3.3 2.5c1.5 3.2 4.7 5.5 9.2 5.5z"/>
              <path fill="#4285F4" d="M21.1 12.2H12v3.9h5.5c-.3 1.3-1.1 2.2-2.3 2.9l3 2.4c1.8-1.7 2.9-4.2 2.9-7.2 0-.5 0-.9-.1-1.2z"/>
            </svg>
          </span>
          <span>{t.continueGoogle}</span>
        </button>

        <div id="recaptcha-container" style={{ marginTop: 10 }} />
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  )
}

function Menu({ t, theme, setTheme, lang, setLang, open, onClose, onLogout }) {
  const items = [
    { to: '/', label: t.dashboard, end: true },
    { to: '/profile', label: t.profile },
    { to: '/weekly-plan', label: t.weeklyPlan },
    { to: '/daily-log', label: t.dailyLog },
    { to: '/reminders', label: t.reminders },
  ]

  return (
    <>
      {open && <div className="menu-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand-wrap">
          <h2 className="brand">Calorion</h2>
          <button className="icon-btn close-btn" onClick={onClose}>✕</button>
        </div>
        <nav>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="menu-controls">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{t.mode}: {theme === 'light' ? t.light : t.dark}</button>
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t.language}: {lang === 'en' ? t.english : t.arabic}</button>
          <button onClick={onLogout}>{t.logoutLabel}</button>
        </div>
      </aside>
    </>
  )
}

function OnboardingWizard({ t, onDone, email }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', country: '', cuisines: '', heightCm: '', currentWeightKg: '', targetWeightKg: '',
    goal: 'small-loss', activityLevel: 'moderate', ramadanMode: false, ramadanCity: '', ramadanCountry: '',
  })

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }))

  const finish = async () => {
    await apiPost('/api/users/profile', {
      ...form,
      email,
      cuisines: form.cuisines.split(',').map((x) => x.trim()).filter(Boolean),
      heightCm: Number(form.heightCm || 0),
      currentWeightKg: Number(form.currentWeightKg || 0),
      targetWeightKg: Number(form.targetWeightKg || 0),
    })
    onDone()
  }

  return (
    <section className="card onboarding-card">
      <div className="step">{t.step} {step}/4</div>
      {step === 1 && (<><h2>{t.welcome}</h2><label>{t.email}<input value={email} disabled /></label><label>{t.name}<input value={form.name} onChange={(e) => update('name', e.target.value)} /></label></>)}
      {step === 2 && (<><h2>{t.bodyMetrics}</h2><label>{t.height}<input type="number" value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} /></label><label>{t.currentWeight}<input type="number" value={form.currentWeightKg} onChange={(e) => update('currentWeightKg', e.target.value)} /></label><label>{t.targetWeight}<input type="number" value={form.targetWeightKg} onChange={(e) => update('targetWeightKg', e.target.value)} /></label></>)}
      {step === 3 && (<><h2>{t.personalization}</h2><label>{t.country}<input value={form.country} onChange={(e) => update('country', e.target.value)} /></label><label>{t.cuisines}<input value={form.cuisines} onChange={(e) => update('cuisines', e.target.value)} /></label><label>{t.goal}<select value={form.goal} onChange={(e) => update('goal', e.target.value)}><option value="big-loss">{t.bigLoss}</option><option value="small-loss">{t.smallLoss}</option><option value="maintain">{t.maintain}</option></select></label></>)}
      {step === 4 && (
        <>
          <h2>{t.activity}</h2>
          <label>{t.activityLevel}<select value={form.activityLevel} onChange={(e) => update('activityLevel', e.target.value)}><option value="low">{t.low}</option><option value="moderate">{t.moderate}</option><option value="high">{t.high}</option></select></label>
          <label><input type="checkbox" checked={form.ramadanMode} onChange={(e) => update('ramadanMode', e.target.checked)} /> {t.ramadanMode}</label>
          {form.ramadanMode && <div className="grid two"><label>{t.city}<input value={form.ramadanCity} onChange={(e) => update('ramadanCity', e.target.value)} /></label><label>{t.country}<input value={form.ramadanCountry} onChange={(e) => update('ramadanCountry', e.target.value)} /></label></div>}
          <p>{t.readyToStart}</p>
        </>
      )}
      <div className="wizard-actions">{step > 1 ? <button onClick={() => setStep((s) => s - 1)}>{t.back}</button> : <span />} {step < 4 ? <button onClick={() => setStep((s) => s + 1)}>{t.next}</button> : <button onClick={finish}>{t.finish}</button>}</div>
    </section>
  )
}

function DashboardPage({ t, profile, ramadanTimings }) {
  return <section className="card"><h1>{t.dashboard}</h1><p>{t.dailyTarget}: <strong>{profile?.dailyCaloriesTarget || 0} kcal</strong></p>{profile?.ramadanMode && ramadanTimings && <p>{t.fajr}: <strong>{ramadanTimings.fajr}</strong> · {t.maghrib}: <strong>{ramadanTimings.maghrib}</strong></p>}<p>{t.subtitle}</p></section>
}

function ProfilePage({ t, profile, reloadProfile }) {
  const [timings, setTimings] = useState(null)

  const fetchTimings = async () => {
    if (!profile?.ramadanCity || !profile?.ramadanCountry) return
    const d = await apiGet(`/api/users/ramadan/timings?city=${encodeURIComponent(profile.ramadanCity)}&country=${encodeURIComponent(profile.ramadanCountry)}`)
    setTimings(d)
  }

  const toggleRamadan = async () => {
    await apiPost('/api/users/profile', {
      ...profile,
      email: profile.email,
      name: profile.name,
      cuisines: profile.cuisines || [],
      ramadanMode: !profile.ramadanMode,
    })
    reloadProfile()
  }

  if (!profile) return <section className="card">{t.loading}</section>
  return <section className="card"><h2>{t.profile}</h2><div className="grid two"><div><strong>{t.name}:</strong> {profile.name}</div><div><strong>{t.email}:</strong> {profile.email}</div><div><strong>{t.country}:</strong> {profile.country}</div><div><strong>{t.goal}:</strong> {profile.goal}</div><div><strong>{t.currentWeight}:</strong> {profile.currentWeightKg}</div><div><strong>{t.targetWeight}:</strong> {profile.targetWeightKg}</div></div><hr /><h3>{t.ramadanMode}</h3><p>{t.ramadanDescription}</p><button onClick={toggleRamadan}>{profile.ramadanMode ? t.disable : t.enable}</button>{profile.ramadanMode && <button onClick={fetchTimings}>{t.fetchTodayTimings}</button>}{timings && <p>{t.fajr}: <strong>{timings.fajr}</strong> · {t.maghrib}: <strong>{timings.maghrib}</strong></p>}</section>
}

function WeeklyPlanPage({ t, profile }) {
  const target = profile?.dailyCaloriesTarget || 2000
  const meals = useMemo(() => [
    { name: t.breakfast, calories: Math.round(target * 0.28) },
    { name: t.lunch, calories: Math.round(target * 0.34) },
    { name: t.dinner, calories: Math.round(target * 0.28) },
    { name: t.snack, calories: Math.round(target * 0.1) },
  ], [t, target])

  return <section className="card"><h2>{t.weeklyPlan}</h2><ul className="list">{meals.map((m) => <li key={m.name}><span>{m.name}</span><strong>{m.calories} kcal</strong></li>)}</ul><p><strong>{t.totalCalories}:</strong> {target} kcal</p></section>
}

function DailyLogPage({ t, profile }) {
  const [consumed, setConsumed] = useState('0')
  const [burned, setBurned] = useState('0')
  const limit = profile?.dailyCaloriesTarget || 0
  const overUnder = Number(consumed || 0) - limit

  return <section className="card"><h2>{t.dailyLog}</h2><div className="grid two"><label>{t.caloriesConsumed}<input type="number" value={consumed} onChange={(e) => setConsumed(e.target.value)} /></label><label>{t.caloriesBurned}<input type="number" value={burned} onChange={(e) => setBurned(e.target.value)} /></label></div><p><strong>{t.dailyLimit}:</strong> {limit} kcal</p><p><strong>{t.netCalories}:</strong> {Number(consumed || 0) - Number(burned || 0)} kcal</p><p><strong>{t.overUnder}:</strong> {overUnder > 0 ? `+${overUnder}` : overUnder} kcal</p></section>
}

function RemindersPage({ t, email }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', time: '08:00', telegramChatId: '', ramadanOnly: false })
  const load = useCallback(async () => setItems(await apiGet('/api/reminders')), [])
  useEffect(() => { load().catch(() => {}) }, [load])
  const create = async () => { await apiPost('/api/reminders', { ...form, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }); setForm({ title: '', time: '08:00', telegramChatId: '', ramadanOnly: false }); load() }
  const remove = async (id) => { await apiDelete(`/api/reminders/${id}`); load() }

  return <section className="card"><h2>{t.reminders}</h2><div className="grid two"><label>{t.reminderText}<input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label><label>{t.time}<input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} /></label><label>{t.telegramChatId}<input value={form.telegramChatId} onChange={(e) => setForm((p) => ({ ...p, telegramChatId: e.target.value }))} /></label><label><input type="checkbox" checked={form.ramadanOnly} onChange={(e) => setForm((p) => ({ ...p, ramadanOnly: e.target.checked }))} /> {t.ramadanOnly}</label></div><button onClick={create}>{t.addReminder}</button><ul className="list">{items.map((r) => <li key={r._id}><span>{r.time} — {r.title}</span><button onClick={() => remove(r._id)}>{t.deleteLabel}</button></li>)}</ul></section>
}

function HelpAiWidget({ t, email }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const chat = await apiPost('/api/chats/message', { content: text })
      setMessages(chat.messages || [])
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button className="help-fab" onClick={() => setOpen(true)} title={t.aiChat}>💬</button>
      {open && <div className="chat-overlay" onClick={() => setOpen(false)}><div className="chat-panel" onClick={(e) => e.stopPropagation()}><div className="chat-header"><strong>{t.aiChat}</strong><button className="icon-btn" onClick={() => setOpen(false)}>✕</button></div><div className="chat-box">{messages.length === 0 && <p>{t.aiPlaceholder}</p>}{messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.content}</div>)}</div><div className="chat-input"><input value={text} onChange={(e) => setText(e.target.value)} placeholder={t.chatInputPlaceholder} /><button onClick={send} disabled={sending}>{sending ? '...' : t.send}</button></div></div></div>}
    </>
  )
}

function App() {
  const [theme, setTheme] = usePersistentState('theme', 'light')
  const [lang, setLang] = usePersistentState('lang', 'en')
  const [appUser, setAppUser] = usePersistentState('app-user', '')
  const [onboardingDone, setOnboardingDone] = usePersistentState('onboarding-done', 'false')
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ramadanTimings, setRamadanTimings] = useState(null)

  const email = useMemo(() => {
    try { return JSON.parse(appUser || '{}')?.email || '' } catch { return '' }
  }, [appUser])

  const t = useMemo(() => copy[lang] || copy.en, [lang])
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        localStorage.removeItem('firebase-id-token')
        setAppUser('')
        return
      }
      const idToken = await firebaseUser.getIdToken()
      localStorage.setItem('firebase-id-token', idToken)
      const res = await apiPost('/api/auth/firebase-login', { idToken })
      setAppUser(JSON.stringify(res.user))
    })
    return () => unsub()
  }, [setAppUser])

  const loadProfile = useCallback(async () => {
    if (!email) return
    try {
      const p = await apiGet('/api/users/profile')
      setProfile(p)
      if (p.ramadanMode && p.ramadanCity && p.ramadanCountry) {
        const times = await apiGet(`/api/users/ramadan/timings?city=${encodeURIComponent(p.ramadanCity)}&country=${encodeURIComponent(p.ramadanCountry)}`)
        setRamadanTimings(times)
      }
    } catch {
      setProfile(null)
    }
  }, [email])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { if (appUser && onboardingDone !== 'true') navigate('/onboarding') }, [onboardingDone, navigate, appUser])

  const finishOnboarding = async () => { setOnboardingDone('true'); await loadProfile(); navigate('/') }
  const logout = async () => { await signOut(auth); localStorage.removeItem('firebase-id-token'); setAppUser(''); setOnboardingDone('false'); navigate('/auth') }

  if (!appUser) {
    return <AuthPage t={t} onAuthenticated={(user) => setAppUser(JSON.stringify(user))} />
  }

  return (
    <main className={`app ${theme}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="topbar"><button className="icon-btn" onClick={() => setMenuOpen(true)}>☰</button><strong>Calorion</strong></header>
      <Menu t={t} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={logout} />
      <section className="content">
        <Routes>
          <Route path="/" element={onboardingDone !== 'true' ? <Navigate to="/onboarding" /> : <DashboardPage t={t} profile={profile} ramadanTimings={ramadanTimings} />} />
          <Route path="/onboarding" element={<OnboardingWizard t={t} onDone={finishOnboarding} email={email} />} />
          <Route path="/profile" element={<ProfilePage t={t} profile={profile} reloadProfile={loadProfile} />} />
          <Route path="/weekly-plan" element={<WeeklyPlanPage t={t} profile={profile} />} />
          <Route path="/daily-log" element={<DailyLogPage t={t} profile={profile} />} />
          <Route path="/reminders" element={<RemindersPage t={t} email={email} />} />
          <Route path="/auth" element={<Navigate to="/" />} />
        </Routes>
      </section>
      <HelpAiWidget t={t} email={email} />
    </main>
  )
}

export default App

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { apiDelete, apiGet, apiPost, apiPut } from './api'
import { auth, googleProvider, startPhoneSignIn } from './firebase'
import { usePersistentState } from './hooks/usePersistentState'
import en from './locales/en.json'
import ar from './locales/ar.json'

const copy = { en, ar }

function isRamadanNow() {
  try {
    const todayHijriMonth = new Intl.DateTimeFormat('en-TN-u-ca-islamic', { month: 'numeric' }).format(new Date())
    return Number(todayHijriMonth) === 9
  } catch {
    return false
  }
}

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

function Menu({ t, theme, setTheme, lang, setLang, open, onClose, onLogout, profile, onOpenProfile }) {
  const items = [
    { to: '/', label: t.dashboard, end: true, icon: '🏠' },
    { to: '/weekly-plan', label: t.weeklyPlan, icon: '🗓️' },
    { to: '/daily-log', label: t.dailyLog, icon: '📝' },
    { to: '/reminders', label: t.reminders, icon: '⏰' },
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
              <span className="sidebar-icon" aria-hidden="true">{i.icon}</span>
              <span className="sidebar-label">{i.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="profile-dock" onClick={onOpenProfile}>
          {profile?.photoUrl ? <img src={profile.photoUrl} alt="profile" className="profile-dock-avatar" /> : <span className="profile-dock-avatar profile-dock-fallback">{(profile?.name || 'U').charAt(0).toUpperCase()}</span>}
          <span>{profile?.name || t.profile}</span>
        </button>
        <div className="menu-switches" aria-label="quick toggles">
          <button className={`switch-icon ${theme === 'dark' ? 'on' : ''}`} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title={t.mode} aria-label={t.mode}>{theme === 'light' ? '🌙' : '☀️'}</button>
          <button className={`switch-icon ${lang === 'ar' ? 'on' : ''}`} onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} title={t.language} aria-label={t.language}>{lang === 'en' ? 'AR' : 'EN'}</button>
          <button className="switch-icon logout" onClick={onLogout} title={t.logoutLabel} aria-label={t.logoutLabel}>🚪</button>
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

function DashboardPage({ t, profile, ramadanTimings, tips }) {
  return (
    <section className="card home-page">
      <h1>{t.dashboard}</h1>
      <p className="home-subtitle">{t.subtitle}</p>

      <div className="metrics-grid">
        <div className="metric"><span>{t.dailyTarget}</span><strong>{profile?.dailyCaloriesTarget || 0} kcal</strong></div>
        <div className="metric"><span>{t.maintenanceCalories}</span><strong>{profile?.maintenanceCalories || 0} kcal</strong></div>
        <div className="metric"><span>{t.calorieCut}</span><strong>{profile?.calorieDeficit || 0} kcal</strong></div>
      </div>

      {profile?.ramadanMode && ramadanTimings && (
        <p>{t.fajr}: <strong>{ramadanTimings.fajr}</strong> · {t.maghrib}: <strong>{ramadanTimings.maghrib}</strong></p>
      )}

      <h3>{t.todayTips}</h3>
      <div className="tips-grid">
        {(tips || []).map((tip, idx) => (
          <article key={tip._id} className="tip-card">
            <div className="tip-chip">#{idx + 1}</div>
            <p>{tip.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProfilePage({ t, profile, reloadProfile }) {
  const [timings, setTimings] = useState(null)
  const [form, setForm] = useState(null)
  const [editing, setEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [cropImage, setCropImage] = useState('')
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const photoInputRef = useRef(null)

  useEffect(() => {
    if (!profile) return
    setForm({
      ...profile,
      cuisinesText: (profile.cuisines || []).join(', '),
    })
  }, [profile])

  const fetchTimings = async () => {
    if (!form?.ramadanCity || !form?.ramadanCountry) return
    const d = await apiGet(`/api/users/ramadan/timings?city=${encodeURIComponent(form.ramadanCity)}&country=${encodeURIComponent(form.ramadanCountry)}`)
    setTimings(d)
  }

  useEffect(() => {
    if (!form?.ramadanMode) {
      setTimings(null)
      return
    }
    fetchTimings().catch(() => {})
  }, [form?.ramadanMode, form?.ramadanCity, form?.ramadanCountry])

  const submitSave = async () => {
    if (!form) return
    await apiPost('/api/users/profile', {
      ...form,
      cuisines: String(form.cuisinesText || '').split(',').map((x) => x.trim()).filter(Boolean),
      currentWeightKg: Number(form.currentWeightKg || 0),
      targetWeightKg: Number(form.targetWeightKg || 0),
      heightCm: Number(form.heightCm || 0),
    })
    setShowConfirm(false)
    setEditing(false)
    reloadProfile()
  }

  const cancelEdit = () => {
    setEditing(false)
    setShowConfirm(false)
    if (!profile) return
    setForm({ ...profile, cuisinesText: (profile.cuisines || []).join(', ') })
  }

  const beginCropFromFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropImage(String(reader.result || ''))
      setCropPos({ x: 0, y: 0 })
      setZoom(1)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const applyCrop = async () => {
    if (!cropImage) return
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = cropImage
    })

    const size = 320
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const cover = Math.max(size / img.width, size / img.height)
    const baseW = img.width * cover
    const baseH = img.height * cover

    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.translate(size / 2 + cropPos.x, size / 2 + cropPos.y)
    ctx.scale(zoom, zoom)
    ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH)
    ctx.restore()

    setForm((p) => ({ ...p, photoUrl: canvas.toDataURL('image/jpeg', 0.92) }))
    setShowCropper(false)
  }

  if (!profile || !form) return <section className="card">{t.loading}</section>
  return (
    <section className="card profile-card">
      <div className="profile-title-row">
        <h2>{t.profile}</h2>
        <button className={`icon-pencil ${editing ? 'cancel' : ''}`} onClick={() => (editing ? cancelEdit() : setEditing(true))} title={editing ? 'Cancel edit' : 'Edit profile'}>{editing ? '✕' : '✎'}</button>
      </div>

      <div className="profile-hero">
        <div className="avatar-crop-wrap" onClick={() => setShowPhotoMenu(true)} role="button">
          {form.photoUrl ? <img src={form.photoUrl} alt="profile" className="profile-avatar" /> : <div className="profile-avatar profile-avatar-fallback">{(form.name || 'U').charAt(0).toUpperCase()}</div>}
        </div>
        <div>
          <strong>{form.name || 'User'}</strong>
          <p>{profile.email}</p>
        </div>
      </div>

      <div className="grid two">
        <label>{t.name}<input disabled={!editing} value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
        <label>{t.country}<input disabled={!editing} value={form.country || ''} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} /></label>
        <label>{t.currentWeight}<input disabled={!editing} type="number" value={form.currentWeightKg || 0} onChange={(e) => setForm((p) => ({ ...p, currentWeightKg: e.target.value }))} /></label>
        <label>{t.targetWeight}<input disabled={!editing} type="number" value={form.targetWeightKg || 0} onChange={(e) => setForm((p) => ({ ...p, targetWeightKg: e.target.value }))} /></label>
        <label>{t.height}<input disabled={!editing} type="number" value={form.heightCm || 0} onChange={(e) => setForm((p) => ({ ...p, heightCm: e.target.value }))} /></label>
        <label>{t.goal}<select disabled={!editing} value={form.goal || 'small-loss'} onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))}><option value="big-loss">{t.bigLoss}</option><option value="small-loss">{t.smallLoss}</option><option value="maintain">{t.maintain}</option></select></label>
        <label>{t.activityLevel}<select disabled={!editing} value={form.activityLevel || 'moderate'} onChange={(e) => setForm((p) => ({ ...p, activityLevel: e.target.value }))}><option value="low">{t.low}</option><option value="moderate">{t.moderate}</option><option value="high">{t.high}</option></select></label>
        <label>{t.cuisines}<input disabled={!editing} value={form.cuisinesText || ''} onChange={(e) => setForm((p) => ({ ...p, cuisinesText: e.target.value }))} /></label>
      </div>

      {editing && (
        <div className="profile-actions-row profile-actions-bottom">
          <button className="primary-btn" onClick={() => setShowConfirm(true)}>{t.saveProfile}</button>
        </div>
      )}

      <div className="profile-metrics-stack">
        <div><span>{t.maintenanceCalories}</span><strong>{profile?.maintenanceCalories || 0}</strong></div>
        <div><span>{t.calorieCut}</span><strong>{profile?.calorieDeficit || 0}</strong></div>
        <div><span>{t.dailyTarget}</span><strong>{profile?.dailyCaloriesTarget || 0}</strong></div>
      </div>

      <hr />
      <h3>{t.ramadanMode}</h3>
      <p>{t.ramadanDescription}</p>
      <label className="ramadan-check"><input disabled={!editing} type="checkbox" checked={!!form.ramadanMode} onChange={(e) => setForm((p) => ({ ...p, ramadanMode: e.target.checked }))} /> {form.ramadanMode ? t.enable : t.disable}</label>

      {form.ramadanMode && (
        <div className="ramadan-tip-box">
          <p><strong>Ramadan tip:</strong> Break your fast with 1-3 dates + 2 cups of water, pray, then eat your main meal after ~30 minutes to avoid overeating.</p>
          <p>Meal pattern: Iftar (after Maghrib + 30 min), Suhoor (before Fajr), and one light sweet snack (e.g. 3 pieces qatayef or 1 piece konafa with nuts).</p>
        </div>
      )}

      {timings && <p>{t.fajr}: <strong>{timings.fajr}</strong> · {t.maghrib}: <strong>{timings.maghrib}</strong></p>}

      {showPhotoMenu && (
        <div className="confirm-overlay" onClick={() => setShowPhotoMenu(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h4>Profile image</h4>
            <div className="confirm-actions profile-image-actions">
              {form.photoUrl && <button className="ghost-btn" onClick={() => { setShowPhotoMenu(false); setShowPhotoPreview(true) }}>View image</button>}
              {editing && <button className="primary-btn" onClick={() => { setShowPhotoMenu(false); photoInputRef.current?.click() }}>Update image</button>}
              <button className="ghost-btn" onClick={() => setShowPhotoMenu(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => beginCropFromFile(e.target.files?.[0])} />

      {showCropper && (
        <div className="photo-preview-overlay" onClick={() => setShowCropper(false)}>
          <div className="photo-preview-card" onClick={(e) => e.stopPropagation()}>
            <h4>Adjust profile photo</h4>
            <div
              className="crop-stage"
              onPointerDown={(e) => { setDragging(true); setDragStart({ x: e.clientX - cropPos.x, y: e.clientY - cropPos.y }) }}
              onPointerMove={(e) => { if (!dragging) return; setCropPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }) }}
              onPointerUp={() => setDragging(false)}
              onPointerLeave={() => setDragging(false)}
            >
              <img src={cropImage} alt="crop" className="crop-image" style={{ transform: `translate(calc(-50% + ${cropPos.x}px), calc(-50% + ${cropPos.y}px)) scale(${zoom})` }} />
              <div className="crop-circle" />
            </div>
            <label>Zoom<input type="range" min="1" max="2.5" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
            <div className="confirm-actions">
              <button className="primary-btn" onClick={applyCrop}>Apply</button>
              <button className="ghost-btn" onClick={() => setShowCropper(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPhotoPreview && form.photoUrl && (
        <div className="photo-preview-overlay" onClick={() => setShowPhotoPreview(false)}>
          <div className="photo-preview-card" onClick={(e) => e.stopPropagation()}>
            <img src={form.photoUrl} alt="Profile preview" className="photo-preview-img" />
            <button className="ghost-btn" onClick={() => setShowPhotoPreview(false)}>Close</button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h4>Confirm profile update</h4>
            <p>Save your new profile values and recalculate calories?</p>
            <div className="confirm-actions">
              <button className="primary-btn" onClick={submitSave}>Yes, save</button>
              <button className="ghost-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function WeeklyPlanPage({ t, profile }) {
  const [plan, setPlan] = useState(null)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    const data = await apiGet('/api/weekly-plan/current')
    setPlan(data)
  }, [])

  useEffect(() => { load().catch(() => {}) }, [load])

  const updateMealField = (dayIdx, mealIdx, key, value) => {
    setPlan((prev) => {
      if (!prev) return prev
      const days = [...(prev.days || [])]
      const day = { ...days[dayIdx] }
      const meals = [...(day.meals || [])]
      meals[mealIdx] = { ...meals[mealIdx], [key]: key === 'calories' || key === 'weightGrams' ? Number(value || 0) : value }
      day.meals = meals
      day.totalCalories = meals.reduce((s, m) => s + Number(m.calories || 0), 0)
      days[dayIdx] = day
      return { ...prev, days }
    })
  }

  const savePlan = async () => {
    if (!plan) return
    await apiPut('/api/weekly-plan/current', { days: plan.days || [] })
    setEditing(false)
    await load()
  }

  if (!plan) return <section className="card">{t.loading}</section>
  return (
    <section className="card">
      <h2>{t.weeklyPlan}</h2>
      {profile?.ramadanMode ? <p>Ramadan-style meals are applied because Ramadan mode is ON.</p> : <p>Normal meal style is active (eggs/chicken/rice etc.).</p>}
      <div className="profile-actions-row">
        {!editing ? <button onClick={() => setEditing(true)}>Edit plan</button> : <button className="primary-btn" onClick={savePlan}>Save plan</button>}
      </div>
      <ul className="list weekly-plan-list">
        {(plan.days || []).map((d, dayIdx) => (
          <li key={d.date} className="weekly-day-item">
            <div className="weekly-day-head">
              <strong>{d.date}</strong>
              <strong>{d.totalCalories} kcal</strong>
            </div>
            <div className="weekly-meals">
              {(d.meals || []).map((m, i) => (
                <div key={i} className="meal-line">
                  {editing ? (
                    <div className="grid two">
                      <label>Meal type<input value={m.mealType || ''} onChange={(e) => updateMealField(dayIdx, i, 'mealType', e.target.value)} /></label>
                      <label>Calories<input type="number" value={m.calories || 0} onChange={(e) => updateMealField(dayIdx, i, 'calories', e.target.value)} /></label>
                      <label>Weight (g)<input type="number" value={m.weightGrams || 0} onChange={(e) => updateMealField(dayIdx, i, 'weightGrams', e.target.value)} /></label>
                      <label>Cuisine<input value={m.cuisine || ''} onChange={(e) => updateMealField(dayIdx, i, 'cuisine', e.target.value)} /></label>
                      <label style={{ gridColumn: '1 / -1' }}>Foods (each line)
                        <textarea value={m.name || ''} onChange={(e) => updateMealField(dayIdx, i, 'name', e.target.value)} rows={3} />
                      </label>
                    </div>
                  ) : (
                    renderRichText(`**${m.mealType}**\n${m.name}\n${m.weightGrams} g (${m.calories} kcal)`)
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
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

function renderRichText(text) {
  const lines = String(text || '').replace(/\\n/g, '\n').split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={i}>
        {parts.map((part, idx) => part.startsWith('**') && part.endsWith('**') ? <strong key={idx}>{part.slice(2, -2)}</strong> : <span key={idx}>{part}</span>)}
        {i < lines.length - 1 && <br />}
      </span>
    )
  })
}

function HelpAiWidget({ t, email }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [freshSession, setFreshSession] = useState(true)

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const chat = await apiPost('/api/chats/message', { content: text, newChat: freshSession })
      setMessages(chat.messages || [])
      setFreshSession(false)
      setText('')
    } finally {
      setSending(false)
    }
  }

  const openNewChat = () => {
    setMessages([])
    setText('')
    setFreshSession(true)
    setOpen(true)
  }

  return (
    <>
      <button className="help-fab" onClick={openNewChat} title={t.aiChat}>💬</button>
      {open && <div className="chat-overlay" onClick={() => setOpen(false)}><div className="chat-panel" onClick={(e) => e.stopPropagation()}><div className="chat-header"><strong>{t.aiChat}</strong><button className="icon-btn" onClick={() => setOpen(false)}>✕</button></div><div className="chat-box">{messages.length === 0 && <p>{t.aiPlaceholder}</p>}{messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{renderRichText(m.content)}</div>)}</div><div className="chat-input"><input value={text} onChange={(e) => setText(e.target.value)} placeholder={t.chatInputPlaceholder} /><button onClick={send} disabled={sending}>{sending ? '...' : t.send}</button></div></div></div>}
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
  const [tips, setTips] = useState([])

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
      let p = await apiGet('/api/users/profile')

      if (!p.ramadanMode && isRamadanNow()) {
        await apiPost('/api/users/profile', {
          ...p,
          ramadanMode: true,
          cuisines: p.cuisines || [],
        })
        p = await apiGet('/api/users/profile')
      }

      setProfile(p)
      if (p.ramadanMode && p.ramadanCity && p.ramadanCountry) {
        const times = await apiGet(`/api/users/ramadan/timings?city=${encodeURIComponent(p.ramadanCity)}&country=${encodeURIComponent(p.ramadanCountry)}`)
        setRamadanTimings(times)
      } else {
        setRamadanTimings(null)
      }
    } catch {
      setProfile(null)
    }
  }, [email])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { apiGet('/api/tips/today').then(setTips).catch(() => setTips([])) }, [])
  useEffect(() => { if (appUser && onboardingDone !== 'true') navigate('/onboarding') }, [onboardingDone, navigate, appUser])

  const finishOnboarding = async () => { setOnboardingDone('true'); await loadProfile(); navigate('/') }
  const logout = async () => { await signOut(auth); localStorage.removeItem('firebase-id-token'); setAppUser(''); setOnboardingDone('false'); navigate('/auth') }

  if (!appUser) {
    return <AuthPage t={t} onAuthenticated={(user) => setAppUser(JSON.stringify(user))} />
  }

  return (
    <main className={`app ${theme}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="topbar"><button className="icon-btn" onClick={() => setMenuOpen(true)}>☰</button><strong>Calorion</strong></header>
      <Menu t={t} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={logout} profile={profile} onOpenProfile={() => { navigate('/profile'); setMenuOpen(false) }} />
      <section className="content">
        <Routes>
          <Route path="/" element={onboardingDone !== 'true' ? <Navigate to="/onboarding" /> : <DashboardPage t={t} profile={profile} ramadanTimings={ramadanTimings} tips={tips} />} />
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

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
          {form.ramadanMode && <div className="grid two daily-log-editor"><label>{t.city}<input value={form.ramadanCity} onChange={(e) => update('ramadanCity', e.target.value)} /></label><label>{t.country}<input value={form.ramadanCountry} onChange={(e) => update('ramadanCountry', e.target.value)} /></label></div>}
          <p>{t.readyToStart}</p>
        </>
      )}
      <div className="wizard-actions">{step > 1 ? <button onClick={() => setStep((s) => s - 1)}>{t.back}</button> : <span />} {step < 4 ? <button onClick={() => setStep((s) => s + 1)}>{t.next}</button> : <button onClick={finish}>{t.finish}</button>}</div>
    </section>
  )
}

function DashboardPage({ t, profile, ramadanTimings, tips }) {
  return (
    <section className="card home-page luxe-home">
      <h1>{t.dashboard}</h1>
      <p className="home-subtitle">{t.subtitle}</p>

      <div className="metrics-grid home-metrics-grid">
        <div className="metric"><span>{t.dailyTarget}</span><strong>{profile?.dailyCaloriesTarget || 0} kcal</strong></div>
        <div className="metric"><span>{t.maintenanceCalories}</span><strong>{profile?.maintenanceCalories || 0} kcal</strong></div>
        <div className="metric"><span>{t.calorieCut}</span><strong>{profile?.calorieDeficit || 0} kcal</strong></div>
      </div>

      {profile?.ramadanMode && ramadanTimings && (
        <p>{t.fajr}: <strong>{ramadanTimings.fajr}</strong> · {t.maghrib}: <strong>{ramadanTimings.maghrib}</strong></p>
      )}

      <h3 className="tips-title">{t.todayTips}</h3>
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
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef(null)
  const cropStageRef = useRef(null)

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
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    const maxBytes = 8 * 1024 * 1024

    if (!allowedTypes.has(file.type) || file.size > maxBytes) {
      setPhotoError('Use JPG/PNG/WEBP image under 8MB.')
      return
    }

    setPhotoError('')
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

    const stageRect = cropStageRef.current?.getBoundingClientRect()
    const stageSize = Math.max(1, Math.min(stageRect?.width || 320, stageRect?.height || 320))

    const size = 320
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const cover = Math.max(stageSize / img.width, stageSize / img.height)
    const displayW = img.width * cover
    const displayH = img.height * cover
    const outScale = size / stageSize

    ctx.save()
    ctx.scale(outScale, outScale)
    ctx.beginPath()
    ctx.arc(stageSize / 2, stageSize / 2, stageSize / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.translate(stageSize / 2 + cropPos.x, stageSize / 2 + cropPos.y)
    ctx.scale(zoom, zoom)
    ctx.drawImage(img, -displayW / 2, -displayH / 2, displayW, displayH)
    ctx.restore()

    setForm((p) => ({ ...p, photoUrl: canvas.toDataURL('image/jpeg', 0.92) }))
    setShowCropper(false)
  }

  if (!profile || !form) return <section className="card">{t.loading}</section>
  return (
    <section className="card profile-card luxe-profile">
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

      <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => beginCropFromFile(e.target.files?.[0])} />
      {photoError && <p className="error-text">{photoError}</p>}

      {showCropper && (
        <div className="photo-preview-overlay" onClick={() => setShowCropper(false)}>
          <div className="photo-preview-card" onClick={(e) => e.stopPropagation()}>
            <h4>Adjust profile photo</h4>
            <div
              ref={cropStageRef}
              className="crop-stage"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setDragging(true)
                setDragStart({ x: e.clientX - cropPos.x, y: e.clientY - cropPos.y })
              }}
              onPointerMove={(e) => {
                if (!dragging) return
                setCropPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
              }}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
                setDragging(false)
              }}
              onPointerCancel={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
                setDragging(false)
              }}
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

function WeeklyPlanPage({ t, profile, lang }) {
  const [plan, setPlan] = useState(null)
  const [editing, setEditing] = useState(false)

  const toLabel = (value) => {
    const s = String(value || '').trim().toLowerCase()
    if (s === 'breakfast') return t.breakfast
    if (s === 'lunch') return t.lunch
    if (s === 'dinner') return t.dinner
    if (s === 'snack') return t.snack
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  }

  const toTitleCase = (value) => String(value || '')
    .toLowerCase()
    .replace(/\b\p{L}/gu, (ch) => ch.toUpperCase())

  const load = useCallback(async () => {
    const data = await apiGet(`/api/weekly-plan/current?lang=${encodeURIComponent(lang || 'en')}`)
    setPlan(data)
  }, [lang])

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
    <section className="card weekly-plan-page">
      <div className="weekly-plan-head-row">
        <h2 className="weekly-plan-title">{t.weeklyPlan}</h2>
        <span className={`ai-chip ${plan?.generatedBy === 'ai' ? 'on' : 'off'}`}>{plan?.generatedBy === 'ai' ? t.aiChipOn : t.aiChipOff}</span>
      </div>
      {profile?.ramadanMode ? <p>{t.weeklyRamadanActive}</p> : <p>{t.weeklyNormalActive}</p>}
      <div className="profile-actions-row weekly-actions-row">
        {!editing ? <button onClick={() => setEditing(true)}>{t.editPlan}</button> : <button className="primary-btn" onClick={savePlan}>{t.savePlan}</button>}
      </div>
      <ul className="list weekly-plan-list weekly-plan-luxe-list">
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
                      <label>Meal type<input value={m.mealType || ''} onChange={(e) => updateMealField(dayIdx, i, 'mealType', String(e.target.value || '').toLowerCase())} /></label>
                      <label>Calories<input type="number" value={m.calories || 0} onChange={(e) => updateMealField(dayIdx, i, 'calories', e.target.value)} /></label>
                      <label>Weight (g)<input type="number" value={m.weightGrams || 0} onChange={(e) => updateMealField(dayIdx, i, 'weightGrams', e.target.value)} /></label>
                      <label>Cuisine<input value={m.cuisine || ''} onChange={(e) => updateMealField(dayIdx, i, 'cuisine', e.target.value)} /></label>
                      <label style={{ gridColumn: '1 / -1' }}>Foods (each line)
                        <textarea value={m.name || ''} onChange={(e) => updateMealField(dayIdx, i, 'name', e.target.value)} rows={3} />
                      </label>
                    </div>
                  ) : (
                    <article className="meal-read-card">
                      <h4 className="meal-read-title">{toLabel(m.mealType)}</h4>
                      <p className="meal-read-foods">{String(m.name || '').split('\n').map((line, idx) => <span key={idx}>{toTitleCase(line)}<br /></span>)}</p>
                      <p className="meal-read-meta">({m.weightGrams} g) · ({m.calories} kcal)</p>
                    </article>
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
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [items, setItems] = useState([])
  const [recent, setRecent] = useState([])
  const [showAddConfirm, setShowAddConfirm] = useState(false)
  const [draft, setDraft] = useState({ type: 'consumed', label: '', value: 0 })

  const makeItemId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const loadDate = useCallback(async (selectedDate) => {
    const row = await apiGet(`/api/daily-logs/by-date?date=${encodeURIComponent(selectedDate)}`)
    setItems((row.items || []).map((it) => ({ ...it, id: it.id || makeItemId() })))
  }, [])

  const loadRecent = useCallback(async () => {
    const rows = await apiGet('/api/daily-logs/recent')
    setRecent(rows || [])
  }, [])

  const persistItems = useCallback(async (selectedDate, nextItems) => {
    await apiPut('/api/daily-logs/by-date', { date: selectedDate, items: nextItems })
    await loadRecent()
  }, [loadRecent])

  useEffect(() => { loadDate(date).catch(() => {}) }, [date, loadDate])
  useEffect(() => { loadRecent().catch(() => {}) }, [loadRecent])

  const askAddItem = () => {
    if (!draft.label.trim()) return
    setShowAddConfirm(true)
  }

  const confirmAddItem = async () => {
    const selectedDate = date
    const newItem = { id: makeItemId(), ...draft, value: Number(draft.value || 0) }
    setItems((prev) => {
      const nextItems = [...prev, newItem]
      void persistItems(selectedDate, nextItems)
      return nextItems
    })
    setDraft({ type: 'consumed', label: '', value: 0 })
    setShowAddConfirm(false)
  }

  const removeItem = async (itemId) => {
    const selectedDate = date
    setItems((prev) => {
      const nextItems = prev.filter((it) => it.id !== itemId)
      void persistItems(selectedDate, nextItems)
      return nextItems
    })
  }

  const caloriesConsumed = items.filter((x) => x.type === 'consumed').reduce((s, x) => s + Number(x.value || 0), 0)
  const caloriesBurned = items.filter((x) => x.type === 'burned').reduce((s, x) => s + Number(x.value || 0), 0)
  const balance = items.filter((x) => x.type === 'balance').reduce((s, x) => s + Number(x.value || 0), 0)
  const limit = profile?.dailyCaloriesTarget || 0
  const net = caloriesConsumed - caloriesBurned
  const overUnder = net - limit

  return (
    <section className="card daily-log-page">
      <h2 className="daily-log-title">{t.dailyLog}</h2>
      <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>

      <div className="grid two">
        <label>Type
          <select value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}>
            <option value="consumed">Consumed</option>
            <option value="burned">Burned</option>
            <option value="balance">Balance</option>
          </select>
        </label>
        <label>Value
          <input type="number" value={draft.value} onChange={(e) => setDraft((p) => ({ ...p, value: Number(e.target.value || 0) }))} />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>Item
          <input value={draft.label} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))} placeholder="e.g. chicken sandwich / walking / body weight" />
        </label>
      </div>
      <button className="add-item-btn" onClick={askAddItem}>Add item</button>

      <ul className="daily-log-cards">
        {items.map((it) => (
          <li key={it.id} className={`daily-log-card ${it.type}`}>
            <div className="daily-log-card-top">
              <strong className="pill">{it.type}</strong>
              <strong>{Number(it.value || 0)}</strong>
            </div>
            <div className="daily-log-card-label">{it.label}</div>
            <button className="ghost-btn" onClick={() => removeItem(it.id)}>Remove</button>
          </li>
        ))}
      </ul>

      <div className="daily-log-metrics">
        <p><strong>{t.dailyLimit}:</strong> {limit} kcal</p>
        <p><strong>{t.netCalories}:</strong> {net} kcal</p>
        <p><strong>{t.overUnder}:</strong> {overUnder > 0 ? `+${overUnder}` : overUnder} kcal</p>
        <p><strong>Balance:</strong> {balance}</p>
      </div>

      <h3>Recent logs</h3>
      <ul className="list">
        {recent.map((r) => (
          <li key={r._id || r.date}>
            <span>{r.date} — net {Number(r.caloriesConsumed || 0) - Number(r.caloriesBurned || 0)} kcal — balance {Number(r.balance || 0)}</span>
          </li>
        ))}
      </ul>

      {showAddConfirm && (
        <div className="confirm-overlay" onClick={() => setShowAddConfirm(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h4>Confirm add item</h4>
            <p>Add this item to {date} and save automatically?</p>
            <div className="confirm-actions">
              <button className="primary-btn" onClick={confirmAddItem}>Yes, add item</button>
              <button className="ghost-btn" onClick={() => setShowAddConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
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
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not send right now. Please try again.' }])
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
  useEffect(() => { apiGet(`/api/tips/today?lang=${encodeURIComponent(lang)}`).then(setTips).catch(() => setTips([])) }, [lang])
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
          <Route path="/weekly-plan" element={<WeeklyPlanPage t={t} profile={profile} lang={lang} />} />
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

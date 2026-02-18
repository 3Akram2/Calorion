import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { apiGet, appLoginWithToken } from './api'
import { TEXT } from './constants'
import { auth, loginWithGoogle } from './firebase'
import './App.css'

function App() {
  const [appUser, setAppUser] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [users, setUsers] = useState([])
  const [chats, setChats] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAppUser(null)
        return
      }
      try {
        const login = await appLoginWithToken(u)
        if (login?.user?.role !== 'admin') {
          setError(TEXT.NOT_ADMIN)
          await signOut(auth)
          localStorage.removeItem('firebase-id-token')
          return
        }
        setAppUser(login.user)
      } catch (e) {
        setError(e.message)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!appUser) return
    Promise.all([apiGet('/api/admin/metrics'), apiGet('/api/admin/users'), apiGet('/api/admin/chats')])
      .then(([m, u, c]) => {
        setMetrics(m)
        setUsers(u)
        setChats(c)
      })
      .catch((e) => setError(e.message))
  }, [appUser])

  const login = async () => {
    setError('')
    try {
      await loginWithGoogle()
    } catch (e) {
      setError(e.message)
    }
  }

  const logout = async () => {
    await signOut(auth)
    localStorage.removeItem('firebase-id-token')
    setAppUser(null)
  }

  if (!appUser) {
    return (
      <main className="auth-wrap">
        <section className="auth-card">
          <h1>{TEXT.ADMIN_TITLE}</h1>
          <p>{TEXT.ADMIN_SUBTITLE}</p>
          <button onClick={login}>Login with Google</button>
          {error && <p className="error">{error}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <header>
        <h1>{TEXT.DASHBOARD_TITLE}</h1>
        <button onClick={logout}>Logout</button>
      </header>

      <section className="metrics">
        <div><span>Total users</span><strong>{metrics?.totalUsers ?? '-'}</strong></div>
        <div><span>Total chats</span><strong>{metrics?.totalChats ?? '-'}</strong></div>
        <div><span>Total messages</span><strong>{metrics?.totalMessages ?? '-'}</strong></div>
        <div><span>New users (7d)</span><strong>{metrics?.newUsers7d ?? '-'}</strong></div>
      </section>

      <section>
        <h2>Users</h2>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Country</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.country}</td></tr>)}</tbody>
        </table>
      </section>

      <section>
        <h2>Chats</h2>
        <table>
          <thead><tr><th>Title</th><th>Messages</th><th>Updated</th></tr></thead>
          <tbody>{chats.map((c) => <tr key={c._id}><td>{c.title}</td><td>{c.messages?.length || 0}</td><td>{new Date(c.updatedAt).toLocaleString()}</td></tr>)}</tbody>
        </table>
      </section>

      {error && <p className="error">{error}</p>}
    </main>
  )
}

export default App

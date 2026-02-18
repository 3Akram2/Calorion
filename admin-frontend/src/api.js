function authHeader() {
  const token = localStorage.getItem('firebase-id-token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet(path) {
  const res = await fetch(path, { headers: authHeader() })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export async function appLoginWithToken(user) {
  const idToken = await user.getIdToken()
  localStorage.setItem('firebase-id-token', idToken)
  const res = await fetch('/api/auth/firebase-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

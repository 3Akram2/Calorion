const JSON_HEADERS = { 'Content-Type': 'application/json' }

function withAuth(headers = {}) {
  const token = localStorage.getItem('firebase-id-token') || ''
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers
}

export async function apiGet(path) {
  const res = await fetch(path, { headers: withAuth() })
  if (!res.ok) throw new Error(`GET ${path} failed`)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: withAuth(JSON_HEADERS),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed`)
  return res.json()
}

export async function apiPut(path, body) {
  const res = await fetch(path, {
    method: 'PUT',
    headers: withAuth(JSON_HEADERS),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PUT ${path} failed`)
  return res.json()
}

export async function apiDelete(path) {
  const res = await fetch(path, { method: 'DELETE', headers: withAuth() })
  if (!res.ok) throw new Error(`DELETE ${path} failed`)
  return res.json()
}

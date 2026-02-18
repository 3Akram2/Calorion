const JSON_HEADERS = { 'Content-Type': 'application/json' }

export async function apiGet(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`GET ${path} failed`)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed`)
  return res.json()
}

export async function apiDelete(path) {
  const res = await fetch(path, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path} failed`)
  return res.json()
}

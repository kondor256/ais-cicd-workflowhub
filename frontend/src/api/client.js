const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json()
}

export const api = {
  get: (path) => request(path),
}

export const getHealth = () => api.get('/api/health/')

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const TOKEN_KEY = 'workflowhub.token'

// localStorage can throw (private windows, blocked site data), so every access is guarded.
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

const tokenListeners = new Set()

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Storage is unavailable: the session just will not survive a reload.
  }
  tokenListeners.forEach((listener) => listener(token))
}

export function onTokenChange(listener) {
  tokenListeners.add(listener)
  return () => tokenListeners.delete(listener)
}

export class ApiError extends Error {
  constructor(status, body) {
    super(`Request failed: ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  })
  // DRF error bodies look like {field: [messages]}; the body may be empty or not JSON.
  const body = await response.json().catch(() => null)
  if (response.status === 401) {
    // The token is missing, expired or revoked: drop it so the app sends the user to log in.
    setToken(null)
  }
  if (!response.ok) {
    throw new ApiError(response.status, body)
  }
  return body
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),
}

export const getHealth = () => api.get('/api/health/')

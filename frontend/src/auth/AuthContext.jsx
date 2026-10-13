import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken, onTokenChange, setToken } from '../api/client'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken)
  const [username, setUsername] = useState(null)

  // Keep React state in step with the stored token (e.g. cleared by a 401 in the API client).
  useEffect(
    () =>
      onTokenChange((newToken) => {
        setTokenState(newToken)
        if (!newToken) setUsername(null)
      }),
    [],
  )

  const login = useCallback(async (name, password) => {
    const data = await api.post('/api/auth/login/', { username: name, password })
    setToken(data.token)
    setUsername(name)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout/')
    } catch {
      // Log out locally even if the server could not be reached.
    } finally {
      setToken(null)
    }
  }, [])

  const value = useMemo(
    () => ({ token, username, login, logout }),
    [token, username, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import Login from './Login'

// The real API client and AuthProvider run; only the network (fetch) is replaced.
function stubFetch(status, body) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/workflows" element={<p>Workflows page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function submit(username, password) {
  await userEvent.type(screen.getByLabelText('Username'), username)
  await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('Login', () => {
  it('stores the token and opens the workflows page on success', async () => {
    const fetchMock = stubFetch(200, { token: 'abc123' })
    renderLogin()
    await submit('alice', 'secret-pass')

    expect(await screen.findByText('Workflows page')).toBeInTheDocument()
    expect(localStorage.getItem('workflowhub.token')).toBe('abc123')
    const [url, options] = fetchMock.mock.calls[0]
    // Only the path is checked: CI may set VITE_API_URL, which adds a host in front of it.
    expect(new URL(url, 'http://localhost').pathname).toBe('/api/auth/login/')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ username: 'alice', password: 'secret-pass' })
  })

  it('shows an error for wrong credentials (400 from the API)', async () => {
    stubFetch(400, { non_field_errors: ['Unable to log in with provided credentials.'] })
    renderLogin()
    await submit('alice', 'wrong')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password')
    expect(localStorage.getItem('workflowhub.token')).toBeNull()
  })

  it('shows a general error when the server fails', async () => {
    stubFetch(500, null)
    renderLogin()
    await submit('alice', 'secret-pass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not log in. Please try again.')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
  })
})

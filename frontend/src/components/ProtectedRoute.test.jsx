import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import ProtectedRoute from './ProtectedRoute'

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/workflows" element={<p>Workflows page</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('sends a logged-out user to the login page', () => {
    renderAt('/workflows')
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Workflows page')).not.toBeInTheDocument()
  })

  it('shows the page to a logged-in user', () => {
    // AuthProvider reads the stored token when it mounts.
    localStorage.setItem('workflowhub.token', 'abc123')
    renderAt('/workflows')
    expect(screen.getByText('Workflows page')).toBeInTheDocument()
  })
})

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      await login(values.username, values.password)
      navigate('/workflows')
    } catch (err) {
      setError(
        err.status === 400
          ? 'Invalid username or password'
          : 'Could not log in. Please try again.',
      )
      setSending(false)
    }
  }

  return (
    <main>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={values.username}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
          />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={sending}>
          {sending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>
        No account yet? <Link to="/register">Register</Link>
      </p>
    </main>
  )
}

export default Login

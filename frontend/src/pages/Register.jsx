import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const FIELDS = [
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { name: 'password2', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
]

function Register() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ username: '', email: '', password: '', password2: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (values.password !== values.password2) {
      setErrors({ password2: ['Passwords do not match.'] })
      return
    }

    setErrors({})
    setSending(true)
    try {
      await api.post('/api/auth/register/', values)
      navigate('/login')
    } catch (error) {
      if (error.status === 400 && error.body) {
        setErrors(error.body)
      } else {
        setFormError('Could not register. Please try again.')
      }
      setSending(false)
    }
  }

  return (
    <main>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} noValidate>
        {FIELDS.map(({ name, label, type, autoComplete }) => (
          <div className="field" key={name}>
            <label htmlFor={name}>{label}</label>
            <input
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              value={values[name]}
              onChange={handleChange}
              aria-invalid={errors[name] ? 'true' : undefined}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] && (
              <p className="error" id={`${name}-error`}>
                {[].concat(errors[name]).join(' ')}
              </p>
            )}
          </div>
        ))}
        {formError && <p className="error" role="alert">{formError}</p>}
        <button type="submit" disabled={sending}>
          {sending ? 'Registering…' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  )
}

export default Register

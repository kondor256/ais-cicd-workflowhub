import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

function Header() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header>
      <Link to="/">WorkFlowHub</Link>
      <nav>
        {token ? (
          <button type="button" onClick={handleLogout}>Log out</button>
        ) : (
          <>
            <Link to="/login">Login</Link> · <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  )
}

export default Header

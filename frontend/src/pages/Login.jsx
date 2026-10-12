import { Link } from 'react-router-dom'

function Login() {
  return (
    <main>
      <h1>Log in</h1>
      <p>Login is built in WFH-07.</p>
      <p>
        No account yet? <Link to="/register">Register</Link>
      </p>
    </main>
  )
}

export default Login

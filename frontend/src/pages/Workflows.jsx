import { useEffect, useState } from 'react'
import { api } from '../api/client'

function Workflows() {
  const [username, setUsername] = useState(null)

  useEffect(() => {
    api
      .get('/api/auth/me/')
      .then((data) => setUsername(data.username))
      .catch(() => {
        // A 401 clears the token in the API client and ProtectedRoute redirects to /login.
      })
  }, [])

  return (
    <main>
      <h1>Workflows</h1>
      {username && <p>Hello, {username}</p>}
      <p>You have no workflow items yet</p>
    </main>
  )
}

export default Workflows

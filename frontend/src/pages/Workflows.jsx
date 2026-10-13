import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { listItems } from '../api/workflows'
import WorkflowForm from '../components/WorkflowForm'
import WorkflowList from '../components/WorkflowList'

function Workflows() {
  const [username, setUsername] = useState(null)
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    // A 401 clears the token in the API client and ProtectedRoute redirects to /login.
    api
      .get('/api/auth/me/')
      .then((data) => setUsername(data.username))
      .catch(() => {})
    listItems()
      .then((data) => {
        setItems(data)
        setLoaded(true)
      })
      .catch(() => setLoadError('Could not load your workflow items.'))
  }, [])

  // The API returns newest first, so a new item goes to the top.
  const handleCreated = (item) => setItems((current) => [item, ...current])

  return (
    <main>
      <h1>Workflows</h1>
      {username && <p>Hello, {username}</p>}
      <WorkflowForm onCreated={handleCreated} />
      <h2>Your items</h2>
      {loadError && <p className="error" role="alert">{loadError}</p>}
      {loaded && <WorkflowList items={items} />}
    </main>
  )
}

export default Workflows

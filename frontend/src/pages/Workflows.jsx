import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { listItems, updateItem } from '../api/workflows'
import WorkflowForm from '../components/WorkflowForm'
import WorkflowList from '../components/WorkflowList'

function Workflows() {
  const [username, setUsername] = useState(null)
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [updateError, setUpdateError] = useState('')

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

  const handleItemSaved = (saved) =>
    setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)))

  // Update the list straight away; put the old status back if the server refuses.
  const handleStatusChange = async (id, status) => {
    const previous = items.find((item) => item.id === id)?.status
    const setStatus = (value) =>
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status: value } : item)),
      )
    setUpdateError('')
    setStatus(status)
    try {
      const updated = await updateItem(id, { status })
      setItems((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch {
      setStatus(previous)
      setUpdateError('Could not update the status. Please try again.')
    }
  }

  return (
    <main>
      <h1>Workflows</h1>
      {username && <p>Hello, {username}</p>}
      <WorkflowForm onCreated={handleCreated} />
      <h2>Your items</h2>
      {loadError && <p className="error" role="alert">{loadError}</p>}
      {updateError && <p className="error" role="alert">{updateError}</p>}
      {loaded && (
        <WorkflowList
          items={items}
          onStatusChange={handleStatusChange}
          onItemSaved={handleItemSaved}
        />
      )}
    </main>
  )
}

export default Workflows

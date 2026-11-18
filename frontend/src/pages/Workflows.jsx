import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { deleteItem, listItems, updateItem } from '../api/workflows'
import WorkflowForm from '../components/WorkflowForm'
import WorkflowList from '../components/WorkflowList'

function Workflows() {
  const [username, setUsername] = useState(null)
  const [items, setItems] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [updateError, setUpdateError] = useState('')

  useEffect(() => {
    // A 401 clears the token and ProtectedRoute redirects to /login.
    api
      .get('/api/auth/me/')
      .then((data) => setUsername(data.username))
      .catch(() => { })
  }, [])

  useEffect(() => {
    let active = true

    listItems({ status: filterStatus })
      .then((data) => {
        if (!active) return

        setItems(data)
        setLoaded(true)
      })
      .catch(() => {
        if (active) {
          setLoadError('Could not load your workflow items.')
        }
      })

    // Ignore an old response if the user changes filters quickly.
    return () => {
      active = false
    }
  }, [filterStatus])

  const handleFilterChange = (event) => {
    setLoaded(false)
    setLoadError('')
    setFilterStatus(event.target.value)
  }

  const matchesFilter = (item) =>
    filterStatus === 'all' || item.status === filterStatus

  const handleCreated = (item) => {
    if (matchesFilter(item)) {
      setItems((current) => [item, ...current])
    }
  }

  const handleItemSaved = (saved) => {
    setItems((current) =>
      current
        .map((item) => (item.id === saved.id ? saved : item))
        .filter(matchesFilter),
    )
  }

  const handleDelete = async (id) => {
    setUpdateError('')

    try {
      await deleteItem(id)
      setItems((current) => current.filter((item) => item.id !== id))
    } catch {
      setUpdateError('Could not delete the item. Please try again.')
    }
  }

  const handleStatusChange = async (id, status) => {
    const previous = items.find((item) => item.id === id)?.status

    const setStatus = (value) =>
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: value } : item,
        ),
      )

    setUpdateError('')
    setStatus(status)

    try {
      const updated = await updateItem(id, { status })

      setItems((current) =>
        current
          .map((item) => (item.id === id ? updated : item))
          .filter(matchesFilter),
      )
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

      <div>
        <label htmlFor="status-filter">Filter by status</label>
        <select
          id="status-filter"
          value={filterStatus}
          onChange={handleFilterChange}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loadError && (
        <p className="error" role="alert">{loadError}</p>
      )}

      {updateError && (
        <p className="error" role="alert">{updateError}</p>
      )}

      {loaded && (
        <WorkflowList
          items={items}
          onStatusChange={handleStatusChange}
          onItemSaved={handleItemSaved}
          onDelete={handleDelete}
        />
      )}
    </main>
  )
}

export default Workflows

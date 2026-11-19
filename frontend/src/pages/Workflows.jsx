
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { deleteItem, listItems, updateItem } from '../api/workflows'
import WorkflowForm from '../components/WorkflowForm'
import WorkflowList from '../components/WorkflowList'

function Workflows() {
  const [username, setUsername] = useState(null)
  const [items, setItems] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [count, setCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [updateError, setUpdateError] = useState('')

  // Ignore pagination responses from an earlier filter selection.
  const requestVersion = useRef(0)

  useEffect(() => {
    // A 401 clears the token and ProtectedRoute redirects to /login.
    api
      .get('/api/auth/me/')
      .then((data) => setUsername(data.username))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    const version = requestVersion.current

    listItems({ status: filterStatus, page: 1 })
      .then((data) => {
        if (!active || version !== requestVersion.current) return

        setItems(data.results)
        setCount(data.count)
        setNextPage(data.next ? 2 : null)
        setLoaded(true)
      })
      .catch(() => {
        if (!active || version !== requestVersion.current) return

        setLoadError('Could not load your workflow items.')
      })

    // Ignore outdated responses when the filter changes.
    return () => {
      active = false
    }
  }, [filterStatus])

  const handleFilterChange = (event) => {
    const newStatus = event.target.value

    if (newStatus === filterStatus) return

    requestVersion.current += 1

    // Changing the filter starts again from page 1.
    setItems([])
    setCount(0)
    setNextPage(null)
    setLoadingMore(false)
    setLoaded(false)
    setLoadError('')
    setFilterStatus(newStatus)
  }

  const handleLoadMore = async () => {
    if (loadingMore || nextPage === null) return

    const page = nextPage
    const version = requestVersion.current

    setLoadError('')
    setLoadingMore(true)

    try {
      const data = await listItems({
        status: filterStatus,
        page,
      })

      if (version !== requestVersion.current) return

      // Avoid duplicates when items are created between page requests.
      setItems((current) => {
        const shown = new Set(current.map((item) => item.id))

        return [
          ...current,
          ...data.results.filter((item) => !shown.has(item.id)),
        ]
      })

      setCount(data.count)
      setNextPage(data.next ? page + 1 : null)
    } catch {
      if (version === requestVersion.current) {
        setLoadError('Could not load more items. Please try again.')
      }
    } finally {
      if (version === requestVersion.current) {
        setLoadingMore(false)
      }
    }
  }

  const matchesFilter = (item) =>
    filterStatus === 'all' || item.status === filterStatus

  // New items are created with "pending" status.
  const handleCreated = (item) => {
    if (matchesFilter(item)) {
      setItems((current) => [item, ...current])
      setCount((current) => current + 1)
    }
  }

  const handleItemSaved = (saved) => {
    const wasVisible = items.some((item) => item.id === saved.id)

    setItems((current) =>
      current
        .map((item) => (item.id === saved.id ? saved : item))
        .filter(matchesFilter),
    )

    // An item changing to another status leaves the current filter.
    if (wasVisible && !matchesFilter(saved)) {
      setCount((current) => Math.max(0, current - 1))
    }
  }

  const handleDelete = async (id) => {
    setUpdateError('')

    try {
      await deleteItem(id)

      setItems((current) =>
        current.filter((item) => item.id !== id),
      )
      setCount((current) => Math.max(0, current - 1))
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
      handleItemSaved(updated)
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

      {loaded && items.length > 0 && (
        <p className="meta">
          Showing {items.length} of {count} items
        </p>
      )}

      {loaded && nextPage !== null && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </main>
  )
}

export default Workflows

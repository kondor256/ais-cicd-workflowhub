import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { deleteItem, listItems, updateItem } from '../api/workflows'
import WorkflowForm from '../components/WorkflowForm'
import WorkflowList from '../components/WorkflowList'

function Workflows() {
  const [username, setUsername] = useState(null)
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [updateError, setUpdateError] = useState('')

  useEffect(() => {
    // A 401 clears the token in the API client and ProtectedRoute redirects to /login.
    api
      .get('/api/auth/me/')
      .then((data) => setUsername(data.username))
      .catch(() => {})
    listItems(1)
      .then((data) => {
        setItems(data.results)
        setCount(data.count)
        setNextPage(data.next ? 2 : null)
        setLoaded(true)
      })
      .catch(() => setLoadError('Could not load your workflow items.'))
  }, [])

  const handleLoadMore = async () => {
    setLoadError('')
    setLoadingMore(true)
    try {
      const data = await listItems(nextPage)
      // Items created since the first page shift the pages, so the next page can repeat an
      // item that is already shown. Keep each id only once.
      setItems((current) => {
        const shown = new Set(current.map((item) => item.id))
        return [...current, ...data.results.filter((item) => !shown.has(item.id))]
      })
      setCount(data.count)
      setNextPage(data.next ? nextPage + 1 : null)
    } catch {
      setLoadError('Could not load more items. Please try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  // The API returns newest first, so a new item goes to the top.
  const handleCreated = (item) => {
    setItems((current) => [item, ...current])
    setCount((current) => current + 1)
  }

  const handleItemSaved = (saved) =>
    setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)))

  const handleDelete = async (id) => {
    setUpdateError('')
    try {
      await deleteItem(id)
      setItems((current) => current.filter((item) => item.id !== id))
      setCount((current) => current - 1)
    } catch {
      setUpdateError('Could not delete the item. Please try again.')
    }
  }

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
          onDelete={handleDelete}
        />
      )}
      {loaded && items.length > 0 && (
        <p className="meta">
          Showing {items.length} of {count} items
        </p>
      )}
      {nextPage && (
        <button type="button" onClick={handleLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </main>
  )
}

export default Workflows

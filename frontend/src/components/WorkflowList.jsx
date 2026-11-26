import { useState } from 'react'
import { STATUS_LABELS } from '../statuses'
import StatusBadge from './StatusBadge'
import WorkflowEditForm from './WorkflowEditForm'
function isOverdue(item) {
  if (!item.due_date || item.status === 'completed') {
    return false
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return item.due_date < today
}

function WorkflowList({ items, onStatusChange, onItemSaved, onDelete }) {
  const [editingId, setEditingId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  if (items.length === 0) {
    return <p>You have no workflow items yet</p>
  }

  const handleSaved = (item) => {
    onItemSaved(item)
    setEditingId(null)
  }

  const handleConfirmDelete = async (id) => {
    setDeleting(true)
    await onDelete(id)
    setDeleting(false)
    setConfirmingId(null)
  }

  return (
    <ul className="item-list">
      {items.map((item) =>
        item.id === editingId ? (
          <li key={item.id}>
            <WorkflowEditForm
              item={item}
              onSaved={handleSaved}
              onCancel={() => setEditingId(null)}
            />
          </li>
        ) : (
          <li key={item.id}>
            <h3>{item.title}</h3>
            {item.description && <p>{item.description}</p>}
            {item.due_date && (
              <p className="meta">
                Due date:{' '}
                <time dateTime={item.due_date}>{item.due_date}</time>
                {isOverdue(item) && (
                  <span className="status-badge status-overdue"> ⚠ Overdue</span>
                )}
              </p>
            )}
            <p className="meta">
              <StatusBadge status={item.status} /> · Created{' '}
              <time dateTime={item.created_at}>
                {new Date(item.created_at).toLocaleString()}
              </time>{' '}
              · Updated{' '}
              <time dateTime={item.updated_at}>
                {new Date(item.updated_at).toLocaleString()}
              </time>
            </p>
            <label className="status-select">
              Status{' '}
              <select
                value={item.status}
                onChange={(event) => onStatusChange(item.id, event.target.value)}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>{' '}
            <button type="button" onClick={() => setEditingId(item.id)}>
              Edit
            </button>{' '}
            {confirmingId === item.id ? (
              <span role="alertdialog" aria-label="Confirm delete">
                Delete this item?{' '}
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(item.id)}
                  disabled={deleting}
                >
                  Confirm
                </button>{' '}
                <button type="button" onClick={() => setConfirmingId(null)} disabled={deleting}>
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmingId(item.id)}>
                Delete
              </button>
            )}
          </li>
        ),
      )}
    </ul>
  )
}

export default WorkflowList

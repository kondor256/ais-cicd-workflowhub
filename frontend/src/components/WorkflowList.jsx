import { STATUS_LABELS } from '../statuses'
import StatusBadge from './StatusBadge'

function WorkflowList({ items, onStatusChange }) {
  if (items.length === 0) {
    return <p>You have no workflow items yet</p>
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.id}>
          <h3>{item.title}</h3>
          {item.description && <p>{item.description}</p>}
          <p className="meta">
            <StatusBadge status={item.status} /> · Created{' '}
            <time dateTime={item.created_at}>
              {new Date(item.created_at).toLocaleString()}
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
          </label>
        </li>
      ))}
    </ul>
  )
}

export default WorkflowList

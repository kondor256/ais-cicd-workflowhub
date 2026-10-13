import { STATUS_LABELS } from '../statuses'

// The symbol and the text carry the meaning too, so the badge does not rely on colour alone.
const STATUS_SYMBOLS = {
  pending: '○',
  in_progress: '◐',
  completed: '✓',
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span aria-hidden="true">{STATUS_SYMBOLS[status] ?? '?'}</span>{' '}
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export default StatusBadge

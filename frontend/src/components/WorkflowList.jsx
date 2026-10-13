const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

function WorkflowList({ items }) {
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
            {STATUS_LABELS[item.status] ?? item.status} · Created{' '}
            <time dateTime={item.created_at}>
              {new Date(item.created_at).toLocaleString()}
            </time>
          </p>
        </li>
      ))}
    </ul>
  )
}

export default WorkflowList

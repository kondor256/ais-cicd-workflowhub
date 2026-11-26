import { useState } from 'react'
import { updateItem } from '../api/workflows'

function WorkflowEditForm({ item, onSaved, onCancel }) {
  const [values, setValues] = useState({ title: item.title, description: item.description,
  due_date: item.due_date || '', })
  const [titleError, setTitleError] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTitleError('')
    setError('')
    setSending(true)
    try {
      const updated = await updateItem(item.id, {
        ...values,
        due_date: values.due_date || null,
      })
      onSaved(updated)
    } catch (err) {
      if (err.status === 400 && err.body?.title) {
        setTitleError(err.body.title[0])
      } else {
        setError('Could not save the changes. Please try again.')
      }
      setSending(false)
    }
  }

  const titleId = `edit-title-${item.id}`
  const descriptionId = `edit-description-${item.id}`
  const dueDateId = `edit-due-date-${item.id}`

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          name="title"
          type="text"
          maxLength={200}
          value={values.title}
          onChange={handleChange}
          aria-invalid={titleError ? 'true' : undefined}
        />
        {titleError && <p className="error" role="alert">{titleError}</p>}
      </div>
      <div className="field">
        <label htmlFor={descriptionId}>Description</label>
        <textarea
          id={descriptionId}
          name="description"
          rows={3}
          value={values.description}
          onChange={handleChange}
        />
      </div>
      <div className="field">
        <label htmlFor={dueDateId}>Due date (optional)</label>
        <input
          id={dueDateId}
          name="due_date"
          type="date"
          value={values.due_date}
          onChange={handleChange}
        />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={sending}>
        {sending ? 'Saving…' : 'Save'}
      </button>{' '}
      <button type="button" onClick={onCancel} disabled={sending}>
        Cancel
      </button>
    </form>
  )
}

export default WorkflowEditForm

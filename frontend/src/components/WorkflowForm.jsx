import { useState } from 'react'
import { createItem } from '../api/workflows'

function WorkflowForm({ onCreated }) {
  const [values, setValues] = useState({ title: '', description: '' })
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
      const item = await createItem(values)
      setValues({ title: '', description: '' })
      onCreated(item)
    } catch (err) {
      if (err.status === 400 && err.body?.title) {
        setTitleError(err.body.title[0])
      } else {
        setError('Could not create the item. Please try again.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>New item</h2>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
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
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={values.description}
          onChange={handleChange}
        />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={sending}>
        {sending ? 'Adding…' : 'Add item'}
      </button>
    </form>
  )
}

export default WorkflowForm

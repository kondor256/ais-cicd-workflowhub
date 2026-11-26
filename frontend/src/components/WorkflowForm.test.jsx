
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowForm from './WorkflowForm'
import { createItem } from '../api/workflows'

vi.mock('../api/workflows', () => ({
  createItem: vi.fn(),
}))

describe('WorkflowForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an item with the selected due date', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()
    createItem.mockResolvedValue({ id: 1, title: 'Test task' })

    render(<WorkflowForm onCreated={onCreated} />)

    await user.type(screen.getByLabelText('Title'), 'Test task')
    await user.type(screen.getByLabelText('Due date (optional)'), '2026-12-01')
    await user.click(screen.getByRole('button', { name: 'Add item' }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith({
        title: 'Test task',
        description: '',
        due_date: '2026-12-01',
      })
    })

    expect(onCreated).toHaveBeenCalled()
  })

  it('sends null when due date is empty', async () => {
    const user = userEvent.setup()
    createItem.mockResolvedValue({ id: 2, title: 'No due date' })

    render(<WorkflowForm onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText('Title'), 'No due date')
    await user.click(screen.getByRole('button', { name: 'Add item' }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith({
        title: 'No due date',
        description: '',
        due_date: null,
      })
    })
  })

  it('resets the form after successful creation', async () => {
    const user = userEvent.setup()
    createItem.mockResolvedValue({ id: 3, title: 'New task' })

    render(<WorkflowForm onCreated={vi.fn()} />)

    const titleInput = screen.getByLabelText('Title')
    const dueDateInput = screen.getByLabelText('Due date (optional)')

    await user.type(titleInput, 'New task')
    await user.type(dueDateInput, '2026-12-05')
    await user.click(screen.getByRole('button', { name: 'Add item' }))

    await waitFor(() => {
      expect(titleInput).toHaveValue('')
      expect(dueDateInput).toHaveValue('')
    })
  })
})

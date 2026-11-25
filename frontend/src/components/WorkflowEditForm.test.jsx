
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowEditForm from './WorkflowEditForm'
import { updateItem } from '../api/workflows'

vi.mock('../api/workflows', () => ({
  updateItem: vi.fn(),
}))

const item = {
  id: 1,
  title: 'Write the report',
  description: 'Complete the assignment',
  due_date: '2026-12-01',
}

describe('WorkflowEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the existing due date', () => {
    render(
      <WorkflowEditForm
        item={item}
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Due date (optional)')).toHaveValue('2026-12-01')
  })

  it('updates an item with the changed due date', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    const updatedItem = { ...item, due_date: '2026-12-10' }
    updateItem.mockResolvedValue(updatedItem)

    render(
      <WorkflowEditForm
        item={item}
        onSaved={onSaved}
        onCancel={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Due date (optional)'))
    await user.type(screen.getByLabelText('Due date (optional)'), '2026-12-10')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith(1, {
        title: 'Write the report',
        description: 'Complete the assignment',
        due_date: '2026-12-10',
      })
    })

    expect(onSaved).toHaveBeenCalledWith(updatedItem)
  })

  it('sends null when the due date is cleared', async () => {
    const user = userEvent.setup()
    updateItem.mockResolvedValue({ ...item, due_date: null })

    render(
      <WorkflowEditForm
        item={item}
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Due date (optional)'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith(1, {
        title: 'Write the report',
        description: 'Complete the assignment',
        due_date: null,
      })
    })
  })
})

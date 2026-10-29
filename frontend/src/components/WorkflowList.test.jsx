import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import WorkflowList from './WorkflowList'

const items = [
  {
    id: 1,
    title: 'Write the report',
    description: 'Compare GitHub Actions and CircleCI',
    status: 'in_progress',
    created_at: '2026-10-20T09:00:00Z',
    updated_at: '2026-10-21T09:00:00Z',
  },
  {
    id: 2,
    title: 'Submit the evidence',
    description: '',
    status: 'pending',
    created_at: '2026-10-22T09:00:00Z',
    updated_at: '2026-10-22T09:00:00Z',
  },
]

function renderList(props = {}) {
  const handlers = {
    onStatusChange: vi.fn(),
    onItemSaved: vi.fn(),
    onDelete: vi.fn().mockResolvedValue(),
  }
  render(<WorkflowList items={items} {...handlers} {...props} />)
  return handlers
}

describe('WorkflowList', () => {
  it('shows a message when there are no items', () => {
    renderList({ items: [] })
    expect(screen.getByText('You have no workflow items yet')).toBeInTheDocument()
  })

  it('shows each item with its title and status badge', () => {
    renderList()
    const [first, second] = screen.getAllByRole('listitem')
    expect(first).toHaveTextContent('Write the report')
    expect(first.querySelector('.status-badge')).toHaveTextContent('In Progress')
    expect(second).toHaveTextContent('Submit the evidence')
    expect(second.querySelector('.status-badge')).toHaveTextContent('Pending')
  })

  it('reports a status change with the item id and the new status', async () => {
    const { onStatusChange } = renderList()
    const [firstSelect] = screen.getAllByRole('combobox')
    await userEvent.selectOptions(firstSelect, 'completed')
    expect(onStatusChange).toHaveBeenCalledWith(1, 'completed')
  })

  it('deletes an item only after the user confirms', async () => {
    const { onDelete } = renderList()
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1])
    expect(onDelete).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onDelete).toHaveBeenCalledWith(2)
  })
})

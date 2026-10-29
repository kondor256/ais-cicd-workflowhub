import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['pending', 'Pending'],
    ['in_progress', 'In Progress'],
    ['completed', 'Completed'],
  ])('shows the label for %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toHaveClass(`status-badge status-${status}`)
  })

  it('falls back to the raw value for an unknown status', () => {
    render(<StatusBadge status="archived" />)
    expect(screen.getByText('archived')).toBeInTheDocument()
  })
})

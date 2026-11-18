
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Workflows from './Workflows'

const items = [
  {
    id: 1,
    title: 'Pending task',
    description: '',
    status: 'pending',
  },
  {
    id: 2,
    title: 'In progress task',
    description: '',
    status: 'in_progress',
  },
  {
    id: 3,
    title: 'Completed task',
    description: '',
    status: 'completed',
  },
]

const json = (body) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

function stubApi() {
  const fetchMock = vi.fn(async (url) => {
    const { pathname, searchParams } = new URL(url, 'http://localhost')

    if (pathname === '/api/auth/me/') {
      return json({ username: 'alice' })
    }

    if (pathname === '/api/workflows/items/') {
      const status = searchParams.get('status')
      const results = status
        ? items.filter((item) => item.status === status)
        : items

      return json(results)
    }

    return new Response(null, { status: 404 })
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WFH-16: Workflow status filtering', () => {
  it('shows all items by default', async () => {
    stubApi()
    render(<Workflows />)

    expect(
      await screen.findByRole('heading', { name: 'Pending task' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: 'In progress task' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: 'Completed task' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('combobox', { name: 'Filter by status' }),
    ).toHaveValue('all')
  })

  it('shows only in-progress items and restores All', async () => {
    const fetchMock = stubApi()
    const user = userEvent.setup()

    render(<Workflows />)

    const filter = screen.getByRole('combobox', {
      name: 'Filter by status',
    })

    await screen.findByRole('heading', { name: 'Pending task' })

    await user.selectOptions(filter, 'in_progress')

    expect(
      await screen.findByRole('heading', { name: 'In progress task' }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', { name: 'Pending task' }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('heading', { name: 'Completed task' }),
    ).not.toBeInTheDocument()

    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes('status=in_progress'),
      ),
    ).toBe(true)

    await user.selectOptions(filter, 'all')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Pending task' }),
      ).toBeInTheDocument()

      expect(
        screen.getByRole('heading', { name: 'Completed task' }),
      ).toBeInTheDocument()
    })
  })

  it('supports Pending and Completed filters', async () => {
    stubApi()
    const user = userEvent.setup()

    render(<Workflows />)

    const filter = screen.getByRole('combobox', {
      name: 'Filter by status',
    })

    await screen.findByRole('heading', { name: 'Pending task' })

    await user.selectOptions(filter, 'pending')

    expect(
      await screen.findByRole('heading', { name: 'Pending task' }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', { name: 'Completed task' }),
    ).not.toBeInTheDocument()

    await user.selectOptions(filter, 'completed')

    expect(
      await screen.findByRole('heading', { name: 'Completed task' }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', { name: 'Pending task' }),
    ).not.toBeInTheDocument()
  })
})

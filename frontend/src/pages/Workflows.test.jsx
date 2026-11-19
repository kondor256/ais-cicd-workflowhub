
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Workflows from './Workflows'

// WFH-16: Sample items covering all three workflow statuses.
const filterItems = [
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

// WFH-21: Generate workflow items in newest-first order.
function makeItems(from, to) {
  const items = []

  for (let id = to; id >= from; id -= 1) {
    items.push({
      id,
      title: `Item ${id}`,
      description: '',
      status: 'pending',
      created_at: '2026-11-17T09:00:00Z',
      updated_at: '2026-11-17T09:00:00Z',
    })
  }

  return items
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

// Return the paginated response expected by the merged backend.
const page = (count, results, next) => ({
  count,
  next: next
    ? `http://api.test/api/workflows/items/?page=${next}`
    : null,
  previous: null,
  results,
})

// Keep the real API client and replace only network requests.
// Supports pagination fixtures, status filtering, and combined tests.
function stubApi(pages) {
  const fetchMock = vi.fn(async (url) => {
    const { pathname, searchParams } = new URL(
      url,
      'http://localhost',
    )

    if (pathname === '/api/auth/me/') {
      return json(200, {
        username: 'alice',
        email: 'alice@example.com',
      })
    }

    if (pathname !== '/api/workflows/items/') {
      return json(404, { detail: 'Not found.' })
    }

    const status = searchParams.get('status') || 'all'
    const pageNumber = Number(searchParams.get('page') || '1')

    let response

    if (typeof pages === 'function') {
      response = pages({ status, page: pageNumber })
    } else if (pages) {
      response = pages[pageNumber]
    } else {
      const results =
        status === 'all'
          ? filterItems
          : filterItems.filter((item) => item.status === status)

      response = page(results.length, results, null)
    }

    if (typeof response === 'number') {
      return json(response, { detail: 'error' })
    }

    if (!response) {
      return json(404, { detail: 'Not found.' })
    }

    return json(200, response)
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

const listedTitles = () =>
  within(screen.getByRole('list'))
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)

afterEach(() => {
  vi.unstubAllGlobals()
})

// --------------------------------------------------
// WFH-16: Status filtering tests
// --------------------------------------------------

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

    await screen.findByRole('heading', {
      name: 'Pending task',
    })

    await user.selectOptions(filter, 'in_progress')

    expect(
      await screen.findByRole('heading', {
        name: 'In progress task',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Pending task',
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Completed task',
      }),
    ).not.toBeInTheDocument()

    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes('status=in_progress'),
      ),
    ).toBe(true)

    await user.selectOptions(filter, 'all')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'Pending task',
        }),
      ).toBeInTheDocument()

      expect(
        screen.getByRole('heading', {
          name: 'Completed task',
        }),
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

    await screen.findByRole('heading', {
      name: 'Pending task',
    })

    await user.selectOptions(filter, 'pending')

    expect(
      await screen.findByRole('heading', {
        name: 'Pending task',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Completed task',
      }),
    ).not.toBeInTheDocument()

    await user.selectOptions(filter, 'completed')

    expect(
      await screen.findByRole('heading', {
        name: 'Completed task',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Pending task',
      }),
    ).not.toBeInTheDocument()
  })
})

// --------------------------------------------------
// WFH-21: Pagination tests
// --------------------------------------------------

describe('WFH-21: Workflows page pagination', () => {
  it('shows the first page, count and Load more button', async () => {
    const fetchMock = stubApi({
      1: page(25, makeItems(6, 25), 2),
    })

    render(<Workflows />)

    expect(
      await screen.findByText('Showing 20 of 25 items'),
    ).toBeInTheDocument()

    expect(listedTitles()).toHaveLength(20)

    expect(
      screen.getByRole('button', { name: 'Load more' }),
    ).toBeInTheDocument()

    const listCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/api/workflows/items/'),
    )

    expect(
      new URL(listCall[0], 'http://localhost').search,
    ).toBe('?page=1')
  })

  it('appends the next page and hides Load more on the last page', async () => {
    stubApi({
      1: page(25, makeItems(6, 25), 2),
      2: page(25, makeItems(1, 5), null),
    })

    render(<Workflows />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Load more' }),
    )

    expect(
      await screen.findByText('Showing 25 of 25 items'),
    ).toBeInTheDocument()

    const titles = listedTitles()

    expect(titles).toHaveLength(25)
    expect(titles[0]).toBe('Item 25')
    expect(titles[24]).toBe('Item 1')

    expect(
      screen.queryByRole('button', { name: 'Load more' }),
    ).not.toBeInTheDocument()
  })

  it('hides Load more when everything fits on one page', async () => {
    stubApi({
      1: page(2, makeItems(1, 2), null),
    })

    render(<Workflows />)

    expect(
      await screen.findByText('Showing 2 of 2 items'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('button', { name: 'Load more' }),
    ).not.toBeInTheDocument()
  })

  it('does not show duplicate items when pages shift', async () => {
    stubApi({
      1: page(26, makeItems(7, 26), 2),
      2: page(26, makeItems(1, 7), null),
    })

    render(<Workflows />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Load more' }),
    )

    expect(
      await screen.findByText('Showing 26 of 26 items'),
    ).toBeInTheDocument()

    expect(
      listedTitles().filter((title) => title === 'Item 7'),
    ).toHaveLength(1)
  })

  it('preserves items and shows an error when Load more fails', async () => {
    stubApi({
      1: page(25, makeItems(6, 25), 2),
      2: 500,
    })

    render(<Workflows />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Load more' }),
    )

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Could not load more items')

    expect(listedTitles()).toHaveLength(20)

    expect(
      screen.getByRole('button', { name: 'Load more' }),
    ).toBeEnabled()
  })
})

// --------------------------------------------------
// WFH-16 + WFH-21: Integration test
// --------------------------------------------------

describe('WFH-16 and WFH-21 integration', () => {
  it('preserves the status filter across pages and resets on filter change', async () => {
    const inProgressItems = makeItems(1, 25).map((item) => ({
      ...item,
      status: 'in_progress',
    }))

    const completedItems = makeItems(26, 27).map((item) => ({
      ...item,
      status: 'completed',
    }))

    const allItems = [
      ...completedItems,
      ...inProgressItems,
    ]

    const fetchMock = stubApi(({ status, page: pageNumber }) => {
      if (status === 'in_progress') {
        return page(
          25,
          pageNumber === 1
            ? inProgressItems.slice(0, 20)
            : inProgressItems.slice(20),
          pageNumber === 1 ? 2 : null,
        )
      }

      if (status === 'completed') {
        return page(2, completedItems, null)
      }

      return page(27, allItems.slice(0, 20), 2)
    })

    const user = userEvent.setup()

    render(<Workflows />)

    const filter = screen.getByRole('combobox', {
      name: 'Filter by status',
    })

    // Initially show all items.
    expect(
      await screen.findByText('Showing 20 of 27 items'),
    ).toBeInTheDocument()

    // Select In Progress and start at page 1.
    await user.selectOptions(filter, 'in_progress')

    expect(
      await screen.findByText('Showing 20 of 25 items'),
    ).toBeInTheDocument()

    // Load page 2 with the same filter.
    await user.click(
      screen.getByRole('button', { name: 'Load more' }),
    )

    expect(
      await screen.findByText('Showing 25 of 25 items'),
    ).toBeInTheDocument()

    expect(listedTitles()).toHaveLength(25)

    // Confirm the API requested page 2 of In Progress.
    const requests = fetchMock.mock.calls
      .map(([url]) => new URL(String(url), 'http://localhost'))
      .filter((url) =>
        url.pathname === '/api/workflows/items/',
      )

    expect(
      requests.some((url) =>
        url.searchParams.get('status') === 'in_progress' &&
        url.searchParams.get('page') === '2',
      ),
    ).toBe(true)

    // Switching to Completed resets pagination to page 1.
    await user.selectOptions(filter, 'completed')

    expect(
      await screen.findByText('Showing 2 of 2 items'),
    ).toBeInTheDocument()

    expect(listedTitles()).toEqual(['Item 27', 'Item 26'])

    expect(
      screen.queryByRole('button', { name: 'Load more' }),
    ).not.toBeInTheDocument()

    const finalRequests = fetchMock.mock.calls
      .map(([url]) => new URL(String(url), 'http://localhost'))

    expect(
      finalRequests.some((url) =>
        url.pathname === '/api/workflows/items/' &&
        url.searchParams.get('status') === 'completed' &&
        url.searchParams.get('page') === '1',
      ),
    ).toBe(true)
  })
})

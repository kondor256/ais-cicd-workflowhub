import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Workflows from './Workflows'

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

// The real API client runs; only the network (fetch) is replaced. `pages` maps a page number to
// the paginated response the API would send ({count, next, previous, results}), or to an HTTP
// status for a failure.
function stubApi(pages) {
  const fetchMock = vi.fn(async (url) => {
    const { pathname, searchParams } = new URL(url, 'http://localhost')
    if (pathname === '/api/auth/me/') {
      return json(200, { username: 'alice', email: 'alice@example.com' })
    }
    const page = pages[searchParams.get('page')]
    return typeof page === 'number' ? json(page, { detail: 'error' }) : json(200, page)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const page = (count, results, next) => ({
  count,
  next: next ? `http://api.test/api/workflows/items/?page=${next}` : null,
  previous: null,
  results,
})

const listedTitles = () =>
  within(screen.getByRole('list'))
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)

describe('Workflows page pagination', () => {
  it('shows the first page, the count and a Load more button when there is a next page', async () => {
    const fetchMock = stubApi({ 1: page(25, makeItems(6, 25), 2) })
    render(<Workflows />)

    expect(await screen.findByText('Showing 20 of 25 items')).toBeInTheDocument()
    expect(listedTitles()).toHaveLength(20)
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
    const listCall = fetchMock.mock.calls.find(([url]) => url.includes('/api/workflows/items/'))
    expect(new URL(listCall[0], 'http://localhost').search).toBe('?page=1')
  })

  it('appends the next page on Load more and hides the button on the last page', async () => {
    stubApi({ 1: page(25, makeItems(6, 25), 2), 2: page(25, makeItems(1, 5), null) })
    render(<Workflows />)

    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }))

    expect(await screen.findByText('Showing 25 of 25 items')).toBeInTheDocument()
    const titles = listedTitles()
    expect(titles).toHaveLength(25)
    expect(titles[0]).toBe('Item 25')
    expect(titles[24]).toBe('Item 1')
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('shows no Load more button when everything fits on one page', async () => {
    stubApi({ 1: page(2, makeItems(1, 2), null) })
    render(<Workflows />)

    expect(await screen.findByText('Showing 2 of 2 items')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('does not show an item twice when the pages have shifted', async () => {
    // An item was created after page 1 was loaded, so page 2 starts with the last item of page 1.
    stubApi({ 1: page(26, makeItems(7, 26), 2), 2: page(26, makeItems(1, 7), null) })
    render(<Workflows />)

    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }))

    expect(await screen.findByText('Showing 26 of 26 items')).toBeInTheDocument()
    expect(listedTitles().filter((title) => title === 'Item 7')).toHaveLength(1)
  })

  it('keeps the items and shows an error when loading more fails', async () => {
    stubApi({ 1: page(25, makeItems(6, 25), 2), 2: 500 })
    render(<Workflows />)

    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load more items')
    expect(listedTitles()).toHaveLength(20)
    expect(screen.getByRole('button', { name: 'Load more' })).toBeEnabled()
  })
})

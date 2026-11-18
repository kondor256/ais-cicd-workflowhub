import { api } from './client'

// Fetch workflow items with optional status and page filters.
// Omitting status, or selecting "all", returns all statuses.
export const listItems = ({ status = 'all', page } = {}) => {
  const params = new URLSearchParams()

  if (status !== 'all') {
    params.set('status', status)
  }

  if (page !== undefined) {
    params.set('page', String(page))
  }

  const query = params.toString()
  return api.get(`/api/workflows/items/${query ? `?${query}` : ''}`)
}

export const createItem = (item) => api.post('/api/workflows/items/', item)

export const updateItem = (id, data) => api.patch(`/api/workflows/items/${id}/`, data)

export const deleteItem = (id) => api.delete(`/api/workflows/items/${id}/`)

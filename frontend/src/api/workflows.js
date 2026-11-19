
import { api } from './client'

// Fetch a paginated list of workflow items with optional status filtering.
// Using page numbers avoids following absolute "next" URLs that may use
// HTTP behind HTTPS proxies on Azure and Render.
export const listItems = ({ status = 'all', page = 1 } = {}) => {
  const params = new URLSearchParams()

  params.set('page', String(page))

  // "all" means no status filter.
  if (status !== 'all') {
    params.set('status', status)
  }

  return api.get(`/api/workflows/items/?${params.toString()}`)
}

export const createItem = (item) => api.post('/api/workflows/items/', item)

export const updateItem = (id, data) => api.patch(`/api/workflows/items/${id}/`, data)

export const deleteItem = (id) => api.delete(`/api/workflows/items/${id}/`)

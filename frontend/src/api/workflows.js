import { api } from './client'

// The list is paginated: {count, next, previous, results}. The page number is sent instead of
// following `next`, because behind the HTTPS proxies on Azure and Render `next` may be http://.
export const listItems = (page = 1) => api.get(`/api/workflows/items/?page=${page}`)

export const createItem = (item) => api.post('/api/workflows/items/', item)

export const updateItem = (id, data) => api.patch(`/api/workflows/items/${id}/`, data)

export const deleteItem = (id) => api.delete(`/api/workflows/items/${id}/`)

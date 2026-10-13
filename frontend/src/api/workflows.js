import { api } from './client'

export const listItems = () => api.get('/api/workflows/items/')

export const createItem = (item) => api.post('/api/workflows/items/', item)

export const updateItem = (id, data) => api.patch(`/api/workflows/items/${id}/`, data)

export const deleteItem = (id) => api.delete(`/api/workflows/items/${id}/`)

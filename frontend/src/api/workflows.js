import { api } from './client'

export const listItems = () => api.get('/api/workflows/items/')

export const createItem = (item) => api.post('/api/workflows/items/', item)

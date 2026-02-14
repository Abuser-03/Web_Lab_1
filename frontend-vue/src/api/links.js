import http from './http'

export default {
  getAll() {
    return http.get('/links')
  },

  getById(id) {
    return http.get(`/links/${id}`)
  },

  create(data) {
    return http.post('/links', data)
  },

  update(id, data) {
    return http.put(`/links/${id}`, data)
  },

  delete(id) {
    return http.delete(`/links/${id}`)
  },

  getStats() {
    return http.get('/links/stats')
  },
}

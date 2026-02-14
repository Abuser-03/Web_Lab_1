import http from './http'

export default {
  register(data) {
    return http.post('/auth/register', data)
  },

  login(data) {
    return http.post('/auth/login', data)
  },

  getProfile() {
    return http.get('/auth/profile')
  },
}

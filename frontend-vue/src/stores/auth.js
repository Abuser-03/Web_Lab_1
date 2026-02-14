import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authApi from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const username = computed(() => user.value?.username || '')

  async function login(credentials) {
    const response = await authApi.login(credentials)
    const data = response.data
    token.value = data.token
    user.value = data.data
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.data))
    return data
  }

  async function register(userData) {
    const response = await authApi.register(userData)
    const data = response.data
    token.value = data.token
    user.value = data.data
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.data))
    return data
  }

  async function fetchProfile() {
    const response = await authApi.getProfile()
    const data = response.data
    user.value = data.data
    localStorage.setItem('user', JSON.stringify(data.data))
    return data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    username,
    login,
    register,
    fetchProfile,
    logout,
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import linksApi from '../api/links'

export const useLinksStore = defineStore('links', () => {
  const links = ref([])
  const currentLink = ref(null)
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchLinks() {
    loading.value = true
    error.value = null
    try {
      const response = await linksApi.getAll()
      links.value = response.data.data || []
    } catch (err) {
      error.value = err.response?.data?.message || 'Не удалось загрузить ссылки'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchLink(id) {
    loading.value = true
    error.value = null
    try {
      const response = await linksApi.getById(id)
      currentLink.value = response.data.data
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Не удалось загрузить ссылку'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createLink(data) {
    loading.value = true
    error.value = null
    try {
      const response = await linksApi.create(data)
      links.value.push(response.data.data)
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Не удалось создать ссылку'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateLink(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await linksApi.update(id, data)
      const index = links.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        links.value[index] = response.data.data
      }
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Не удалось обновить ссылку'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteLink(id) {
    loading.value = true
    error.value = null
    try {
      await linksApi.delete(id)
      links.value = links.value.filter((l) => l.id !== id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Не удалось удалить ссылку'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    loading.value = true
    error.value = null
    try {
      const response = await linksApi.getStats()
      stats.value = response.data.data
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Не удалось загрузить статистику'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    links,
    currentLink,
    stats,
    loading,
    error,
    fetchLinks,
    fetchLink,
    createLink,
    updateLink,
    deleteLink,
    fetchStats,
  }
})

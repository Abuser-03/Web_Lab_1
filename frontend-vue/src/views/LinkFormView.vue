<template>
  <div class="form-page">
    <h1>{{ isEdit ? 'Редактировать ссылку' : 'Новая ссылка' }}</h1>

    <AlertMessage
      :message="error"
      @dismiss="error = ''"
    />

    <form @submit.prevent="handleSubmit" class="card-form">
      <div class="form-group">
        <label for="title">Название</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="Мой сайт"
          required
        />
      </div>

      <div class="form-group">
        <label for="url">URL</label>
        <input
          id="url"
          v-model="form.url"
          type="url"
          placeholder="https://example.com"
          required
        />
      </div>

      <div class="form-group">
        <label for="description">Описание</label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Краткое описание ссылки"
          rows="3"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать') }}
        </button>
        <router-link to="/" class="btn btn-secondary">Отмена</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLinksStore } from '../stores/links'
import AlertMessage from '../components/AlertMessage.vue'

const route = useRoute()
const router = useRouter()
const linksStore = useLinksStore()

const isEdit = computed(() => !!route.params.id)
const form = reactive({ title: '', url: '', description: '' })
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  if (isEdit.value) {
    try {
      const link = await linksStore.fetchLink(Number(route.params.id))
      form.title = link.title || ''
      form.url = link.url || ''
      form.description = link.description || ''
    } catch {
      error.value = 'Не удалось загрузить ссылку'
    }
  }
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (isEdit.value) {
      await linksStore.updateLink(Number(route.params.id), { ...form })
    } else {
      await linksStore.createLink({ ...form })
    }
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Ошибка сохранения'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-page {
  max-width: 600px;
  margin: 0 auto;
}

.form-page h1 {
  font-size: 24px;
  color: #fff;
  margin-bottom: 24px;
}

.card-form {
  background: #1a1a2e;
  border: 1px solid #16213e;
  border-radius: 10px;
  padding: 24px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
</style>

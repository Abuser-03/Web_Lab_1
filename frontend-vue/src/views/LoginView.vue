<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Вход</h1>
      <p class="auth-subtitle">Войдите в LinkManager</p>

      <AlertMessage
        :message="error"
        @dismiss="error = ''"
      />

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="username">Имя пользователя</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="username"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="password"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <p class="auth-footer">
        Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AlertMessage from '../components/AlertMessage.vue'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

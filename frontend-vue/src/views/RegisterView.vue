<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Регистрация</h1>
      <p class="auth-subtitle">Создайте аккаунт LinkManager</p>

      <AlertMessage
        :message="error"
        @dismiss="error = ''"
      />

      <form @submit.prevent="handleRegister" class="auth-form">
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
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="email@example.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Минимум 6 символов"
            required
            minlength="6"
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>

      <p class="auth-footer">
        Уже есть аккаунт? <router-link to="/login">Войти</router-link>
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

const form = reactive({ username: '', email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(form)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

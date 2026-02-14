<template>
  <div class="profile-page">
    <h1>Профиль</h1>

    <AlertMessage :message="error" @dismiss="error = ''" />

    <div v-if="loading" class="loader">Загрузка...</div>

    <div v-else-if="profile" class="profile-card">
      <div class="profile-row">
        <span class="label">ID</span>
        <span class="value">{{ profile.id }}</span>
      </div>
      <div class="profile-row">
        <span class="label">Имя пользователя</span>
        <span class="value">{{ profile.username }}</span>
      </div>
      <div class="profile-row">
        <span class="label">Email</span>
        <span class="value">{{ profile.email }}</span>
      </div>
      <div class="profile-row">
        <span class="label">Роль</span>
        <span class="value">
          <span :class="['role-badge', profile.role === 'admin' ? 'role-admin' : 'role-user']">
            {{ profile.role }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import AlertMessage from '../components/AlertMessage.vue'

const auth = useAuthStore()
const profile = ref(null)
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    await auth.fetchProfile()
    profile.value = auth.user
  } catch (err) {
    error.value = err.response?.data?.message || 'Не удалось загрузить профиль'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.profile-page h1 {
  font-size: 24px;
  color: #fff;
  margin-bottom: 24px;
}

.profile-card {
  background: #1a1a2e;
  border: 1px solid #16213e;
  border-radius: 10px;
  overflow: hidden;
}

.profile-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #16213e;
}

.profile-row:last-child {
  border-bottom: none;
}

.label {
  color: #888;
  font-size: 14px;
}

.value {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.role-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.role-admin {
  background: rgba(233, 69, 96, 0.15);
  color: #e94560;
}

.role-user {
  background: rgba(93, 156, 236, 0.15);
  color: #5d9cec;
}

.loader {
  text-align: center;
  color: #888;
  padding: 40px;
}
</style>

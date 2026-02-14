<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="logo">LinkManager</router-link>
      <nav v-if="auth.isAuthenticated" class="nav">
        <router-link to="/" class="nav-link">Ссылки</router-link>
        <router-link to="/stats" class="nav-link">Статистика</router-link>
        <router-link to="/profile" class="nav-link">Профиль</router-link>
      </nav>
      <div v-if="auth.isAuthenticated" class="header-right">
        <span class="username">{{ auth.username }}</span>
        <span v-if="auth.isAdmin" class="badge">admin</span>
        <button class="btn-logout" @click="handleLogout">Выйти</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.header {
  background: #1a1a2e;
  border-bottom: 1px solid #16213e;
  padding: 0 24px;
  height: 56px;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 32px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: #e94560;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  color: #a0a0b8;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-link.router-link-exact-active {
  color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  color: #ccc;
  font-size: 14px;
}

.badge {
  background: #e94560;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.btn-logout {
  background: transparent;
  border: 1px solid #444;
  color: #aaa;
  padding: 5px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-logout:hover {
  border-color: #e94560;
  color: #e94560;
}
</style>

<template>
  <div class="stats-page">
    <h1>Статистика</h1>

    <AlertMessage :message="linksStore.error" @dismiss="linksStore.error = null" />

    <div v-if="linksStore.loading" class="loader">Загрузка...</div>

    <div v-else class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ linksStore.stats?.totalLinks ?? 0 }}</div>
        <div class="stat-label">Всего ссылок</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ linksStore.links.length }}</div>
        <div class="stat-label">Загружено</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLinksStore } from '../stores/links'
import AlertMessage from '../components/AlertMessage.vue'

const linksStore = useLinksStore()

onMounted(() => {
  linksStore.fetchStats()
  if (linksStore.links.length === 0) {
    linksStore.fetchLinks()
  }
})
</script>

<style scoped>
.stats-page {
  max-width: 600px;
  margin: 0 auto;
}

.stats-page h1 {
  font-size: 24px;
  color: #fff;
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #1a1a2e;
  border: 1px solid #16213e;
  border-radius: 10px;
  padding: 24px;
  text-align: center;
}

.stat-value {
  font-size: 40px;
  font-weight: 700;
  color: #e94560;
  margin-bottom: 8px;
}

.stat-label {
  color: #888;
  font-size: 14px;
}

.loader {
  text-align: center;
  color: #888;
  padding: 40px;
}
</style>

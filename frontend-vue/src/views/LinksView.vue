<template>
  <div class="links-page">
    <div class="page-header">
      <h1>Мои ссылки</h1>
      <router-link to="/links/new" class="btn btn-primary">+ Добавить ссылку</router-link>
    </div>

    <AlertMessage
      :message="linksStore.error"
      @dismiss="linksStore.error = null"
    />

    <AlertMessage
      v-if="successMsg"
      :message="successMsg"
      type="success"
      @dismiss="successMsg = ''"
    />

    <div v-if="linksStore.loading" class="loader">Загрузка...</div>

    <div v-else-if="linksStore.links.length === 0" class="empty-state">
      <p>У вас пока нет ссылок</p>
      <router-link to="/links/new" class="btn btn-primary">Создать первую ссылку</router-link>
    </div>

    <div v-else class="links-grid">
      <div v-for="link in linksStore.links" :key="link.id" class="link-card">
        <div class="link-card-header">
          <h3 class="link-title">{{ link.title }}</h3>
          <div class="link-actions">
            <router-link :to="`/links/${link.id}/edit`" class="btn-icon" title="Редактировать">
              &#9998;
            </router-link>
            <button class="btn-icon btn-icon-danger" title="Удалить" @click="handleDelete(link.id)">
              &#10005;
            </button>
          </div>
        </div>
        <a :href="link.url" target="_blank" rel="noopener" class="link-url">{{ link.url }}</a>
        <p v-if="link.description" class="link-desc">{{ link.description }}</p>
        <div class="link-meta">
          <span>{{ formatDate(link.createdAt) }}</span>
          <span v-if="link.userId" class="link-user-id">ID: {{ link.userId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLinksStore } from '../stores/links'
import AlertMessage from '../components/AlertMessage.vue'

const linksStore = useLinksStore()
const successMsg = ref('')

onMounted(() => {
  linksStore.fetchLinks()
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

async function handleDelete(id) {
  if (!confirm('Удалить эту ссылку?')) return
  try {
    await linksStore.deleteLink(id)
    successMsg.value = 'Ссылка удалена'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch {
    // error handled in store
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  color: #fff;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.link-card {
  background: #1a1a2e;
  border: 1px solid #16213e;
  border-radius: 10px;
  padding: 20px;
  transition: border-color 0.2s;
}

.link-card:hover {
  border-color: #e94560;
}

.link-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.link-title {
  font-size: 16px;
  color: #fff;
  margin: 0;
  word-break: break-word;
}

.link-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  color: #aaa;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.btn-icon-danger:hover {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
}

.link-url {
  display: block;
  color: #5d9cec;
  font-size: 13px;
  text-decoration: none;
  word-break: break-all;
  margin-bottom: 8px;
}

.link-url:hover {
  text-decoration: underline;
}

.link-desc {
  color: #888;
  font-size: 13px;
  margin: 0 0 12px;
  line-height: 1.5;
}

.link-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 16px;
}

.loader {
  text-align: center;
  color: #888;
  padding: 40px;
}
</style>

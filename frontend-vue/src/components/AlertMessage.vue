<template>
  <div v-if="message" :class="['alert', `alert-${type}`]">
    {{ message }}
    <button v-if="dismissible" class="alert-close" @click="$emit('dismiss')">&times;</button>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'error' },
  dismissible: { type: Boolean, default: true },
})

defineEmits(['dismiss'])
</script>

<style scoped>
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.alert-error {
  background: rgba(233, 69, 96, 0.15);
  color: #e94560;
  border: 1px solid rgba(233, 69, 96, 0.3);
}

.alert-success {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
  border: 1px solid rgba(46, 213, 115, 0.3);
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  padding: 0 0 0 12px;
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
}
</style>

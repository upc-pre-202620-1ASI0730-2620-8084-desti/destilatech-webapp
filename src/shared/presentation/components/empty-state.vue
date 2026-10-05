<script setup>

defineProps({
  icon: { type: String, default: 'pi pi-inbox' },
  title: { type: String, required: true },
  description: { type: String, default: '' }
});
</script>

<template>
  <div class="empty-state">
    <i :class="icon" class="empty-state__icon" aria-hidden="true"></i>
    <h3>{{ title }}</h3>
    <p v-if="description" class="text-muted">{{ description }}</p>
    <slot/>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.6rem;
  padding: var(--spacing-04) var(--spacing-02);
}

.empty-state__icon {
  font-size: 2.2rem;
  color: var(--color-accent);
}

.empty-state p {
  max-width: 28rem;
}
</style>
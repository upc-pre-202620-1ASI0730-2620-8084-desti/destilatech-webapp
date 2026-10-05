<script setup>

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  badge: { type: String, default: '' }
});
</script>

<template>
  <header class="page-header">
    <div class="page-header__text">
      <div class="flex align-items-center gap-2 flex-wrap">
        <h1>{{ title }}</h1>
        <span v-if="badge" class="page-header__badge">{{ badge }}</span>
      </div>
      <p v-if="subtitle" class="text-muted">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions"/>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--spacing-02);
  flex-wrap: wrap;
}

.page-header__text {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.page-header__badge {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  border-radius: 999px;
  padding: 0.15rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.page-header__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>

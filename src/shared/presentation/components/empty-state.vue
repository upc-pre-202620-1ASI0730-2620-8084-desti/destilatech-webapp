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

</style>
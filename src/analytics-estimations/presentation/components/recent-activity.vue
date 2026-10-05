<script setup>
import { useI18n } from 'vue-i18n';


const props = defineProps({
  items: { type: Array, required: true }
});
const { t, locale } = useI18n();
</script>

<template>
  <div class="surface-panel recent-activity">
    <h2>{{ t('dashboard.recent-activity') }}</h2>
    <ul v-if="props.items.length">
      <li v-for="item in props.items" :key="item.key">
        <span class="recent-activity__dot" :class="`recent-activity__dot--${item.tone}`" aria-hidden="true"></span>
        <div class="flex flex-column">
          <router-link v-if="item.to" :to="item.to" class="recent-activity__text">{{ item.text }}</router-link>
          <span v-else class="recent-activity__text">{{ item.text }}</span>
          <span class="recent-activity__date">{{ item.date.formatWithTime(locale) }}</span>
        </div>
      </li>
    </ul>
    <p v-else class="text-muted text-sm">{{ t('dashboard.no-activity') }}</p>
  </div>
</template>

<style scoped>
.recent-activity {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-02);
}

.recent-activity ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.recent-activity li {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
}

.recent-activity__dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  margin-top: 0.35rem;
  flex-shrink: 0;
}

.recent-activity__dot--success {
  background: var(--color-success);
}

.recent-activity__dot--warn {
  background: var(--color-warn);
}

.recent-activity__dot--danger {
  background: var(--color-danger);
}

.recent-activity__dot--info {
  background: var(--color-primary-light);
}

.recent-activity__text {
  font-size: 0.875rem;
  color: var(--color-text);
}

a.recent-activity__text:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.recent-activity__date {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}
</style>

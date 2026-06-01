<script setup lang="ts">
defineProps<{
  title: string;
  caption?: string;
}>();
</script>

<template>
  <section class="panel-card">
    <header class="panel-card__header">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="caption">{{ caption }}</p>
      </div>
      <span class="panel-card__help">?</span>
    </header>
    <div class="panel-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import ThemeToggle from "./ThemeToggle.vue";
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <div class="app-shell__brand">
        <span class="app-shell__logo">OIO</span>
        <span class="app-shell__brand-text">Lab</span>
      </div>
      <ThemeToggle />
    </header>
    <main class="app-shell__content">
      <slot />
    </main>
  </div>
</template>

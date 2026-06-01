<script setup lang="ts">
import { computed } from "vue";

import { useAppStore } from "../../stores/app";

const appStore = useAppStore();
const isDark = computed(() => appStore.theme === "dark");
</script>

<template>
  <button class="theme-toggle" type="button" data-testid="theme-toggle" @click="appStore.toggleTheme()">
    <span>主题</span>
    <span :class="['theme-toggle__label', { active: !isDark }]">浅色</span>
    <span class="theme-toggle__switch" :class="{ dark: isDark }">
      <span class="theme-toggle__thumb" />
    </span>
    <span :class="['theme-toggle__label', { active: isDark }]">深色</span>
  </button>
</template>

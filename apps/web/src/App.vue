<script setup lang="ts">
import { onMounted } from "vue";

import AppShell from "./shared/ui/AppShell.vue";
import { useAppStore } from "./stores/app";

const appStore = useAppStore();

onMounted(() => {
  appStore.initTheme();
});
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
</template>

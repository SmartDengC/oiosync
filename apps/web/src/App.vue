<script setup lang="ts">
import { onMounted } from "vue";

import AppShell from "./shared/ui/AppShell.vue";
import { useAppStore } from "./stores/app";
import { useAuthStore } from "./stores/auth";

const appStore = useAppStore();
const authStore = useAuthStore();

onMounted(() => {
  appStore.initTheme();
  authStore.initSession();
});
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
</template>

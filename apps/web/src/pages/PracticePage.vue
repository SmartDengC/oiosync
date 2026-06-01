<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import PracticeWorkbench from "../features/practice/PracticeWorkbench.vue";
import { useAppStore } from "../stores/app";
import { usePracticeStore } from "../stores/practice";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const practiceStore = usePracticeStore();

watch(
  () => route.params.audioId,
  async (audioId) => {
    if (typeof audioId === "string") {
      try {
        appStore.setCurrentAudio(audioId);
        await practiceStore.load(audioId);
      } catch {
        appStore.setCurrentAudio(null);
        appStore.pushNotice("当前记录没有真实音频，请重新生成。");
        await router.replace("/");
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!route.params.audioId) {
    router.push("/");
  }
});

onBeforeUnmount(() => {
  practiceStore.setCurrentSeconds(0);
  if (practiceStore.isPlaying) {
    practiceStore.togglePlay();
  }
});
</script>

<template>
  <PracticeWorkbench />
</template>

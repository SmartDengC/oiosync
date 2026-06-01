<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

import AudioLibraryPanel from "../features/audio-library/AudioLibraryPanel.vue";
import GenerationPanel from "../features/generation/GenerationPanel.vue";
import ModelManagerPanel from "../features/model-manager/ModelManagerPanel.vue";
import PracticeWorkbench from "../features/practice/PracticeWorkbench.vue";
import { useAppStore } from "../stores/app";
import { useGenerationStore } from "../stores/generation";
import { useLibraryStore } from "../stores/library";
import { useModelStore } from "../stores/model";
import { usePracticeStore } from "../stores/practice";

const appStore = useAppStore();
const generationStore = useGenerationStore();
const libraryStore = useLibraryStore();
const modelStore = useModelStore();
const practiceStore = usePracticeStore();
const practiceSectionRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  await Promise.all([
    generationStore.loadVoices(),
    modelStore.loadStatus(),
    libraryStore.loadCurrentMonth()
  ]);
});

async function handleOpenPractice(audioId: string) {
  appStore.setCurrentAudio(audioId);
  await practiceStore.load(audioId);
  await nextTick();
  practiceSectionRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}
</script>

<template>
  <div class="page-grid">
    <GenerationPanel />
    <ModelManagerPanel />
    <AudioLibraryPanel @open-practice="handleOpenPractice" />
    <div v-if="practiceStore.payload" ref="practiceSectionRef">
      <PracticeWorkbench />
    </div>
  </div>
</template>

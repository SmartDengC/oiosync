<script setup lang="ts">
import PanelCard from "../../shared/ui/PanelCard.vue";
import { useAppStore } from "../../stores/app";
import { useGenerationStore } from "../../stores/generation";
import { useLibraryStore } from "../../stores/library";

const appStore = useAppStore();
const generationStore = useGenerationStore();
const libraryStore = useLibraryStore();

async function handleGenerate() {
  const task = await generationStore.submitGeneration();

  if (!task?.audioId) {
    return;
  }

  const createdAt = new Date(task.createdAt);
  libraryStore.year = createdAt.getUTCFullYear();
  libraryStore.month = createdAt.getUTCMonth() + 1;
  await libraryStore.loadCurrentMonth();
  appStore.setCurrentAudio(null);
  appStore.pushNotice("已加入生成队列，正在后台生成音频与字幕。");
  await generationStore.pollGeneration(task.id, {
    onCompleted: async (completedTask) => {
      appStore.setCurrentAudio(completedTask.audioId);
      appStore.pushNotice("音频与字幕已生成，可在下方音频库中继续练习。");
      await libraryStore.loadCurrentMonth();
    },
    onFailed: async (failedTask) => {
      appStore.setCurrentAudio(null);
      appStore.pushNotice(failedTask.errorMessage ? `生成失败：${failedTask.errorMessage}` : "生成失败，请重试。");
      await libraryStore.loadCurrentMonth();
    }
  });
}
</script>

<template>
  <PanelCard title="输入文本" caption="输入原文、选择音色并生成练习音频与字幕。">
    <div class="generation-panel">
      <textarea
        v-model="generationStore.text"
        class="generation-panel__textarea"
        placeholder="请输入要生成音频的英文文本"
      />
      <div class="generation-panel__toolbar">
        <label class="generation-panel__voice">
          <span>选择音色</span>
          <select v-model="generationStore.selectedVoiceId">
            <option v-for="voice in generationStore.voices" :key="voice.id" :value="voice.id">
              {{ voice.label }}
            </option>
          </select>
        </label>
        <div class="generation-panel__actions">
          <button
            class="button button--primary"
            data-testid="generate-button"
            :disabled="generationStore.isSubmitting || generationStore.isPolling || !generationStore.text.trim()"
            @click="handleGenerate"
          >
            {{ generationStore.isSubmitting || generationStore.isPolling ? "生成中..." : "生成音频与字幕" }}
          </button>
          <button class="button button--ghost" type="button" @click="generationStore.clearText()">清空</button>
        </div>
      </div>
      <p class="generation-panel__status">{{ generationStore.sentenceProgressLabel }}</p>
      <p v-if="appStore.notice" class="generation-panel__notice">{{ appStore.notice }}</p>
    </div>
  </PanelCard>
</template>

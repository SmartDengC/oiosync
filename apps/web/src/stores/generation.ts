import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { GenerationTask, VoiceOption } from "@oio/contracts";

import { apiClient } from "../shared/api/client";

export const useGenerationStore = defineStore("generation", () => {
  const text = ref("");
  const voices = ref<VoiceOption[]>([]);
  const selectedVoiceId = ref("Mia");
  const task = ref<GenerationTask | null>(null);
  const isSubmitting = ref(false);
  const isPolling = ref(false);
  let pollTimer: number | null = null;

  const sentenceProgressLabel = computed(() => {
    if (!task.value) {
      return "准备开始生成音频与字幕";
    }

    if (task.value.status === "failed") {
      return task.value.errorMessage ? `生成失败：${task.value.errorMessage}` : "生成失败，请重试";
    }

    if (task.value.status === "completed") {
      return `音频与字幕已生成（${task.value.totalSentences} / ${task.value.totalSentences} 句）`;
    }

    return `正在合成语音...（${task.value.completedSentences} / ${task.value.totalSentences} 句）`;
  });

  async function loadVoices() {
    voices.value = await apiClient.getVoices();
    if (!voices.value.find((voice) => voice.id === selectedVoiceId.value) && voices.value[0]) {
      selectedVoiceId.value = voices.value[0].id;
    }
  }

  async function submitGeneration() {
    if (!text.value.trim()) {
      return null;
    }

    isSubmitting.value = true;

    try {
      task.value = await apiClient.createGeneration({
        text: text.value,
        voiceId: selectedVoiceId.value
      });
      return task.value;
    } finally {
      isSubmitting.value = false;
    }
  }

  function clearText() {
    text.value = "";
  }

  function stopPolling() {
    if (pollTimer != null) {
      window.clearTimeout(pollTimer);
      pollTimer = null;
    }
    isPolling.value = false;
  }

  async function pollGeneration(
    taskId: string,
    handlers?: {
      onCompleted?: (nextTask: GenerationTask) => Promise<void> | void;
      onFailed?: (nextTask: GenerationTask) => Promise<void> | void;
    }
  ) {
    stopPolling();
    isPolling.value = true;

    const tick = async (): Promise<void> => {
      try {
        const nextTask = await apiClient.getGeneration(taskId);
        task.value = nextTask;

        if (nextTask.status === "completed") {
          stopPolling();
          await handlers?.onCompleted?.(nextTask);
          return;
        }

        if (nextTask.status === "failed") {
          stopPolling();
          await handlers?.onFailed?.(nextTask);
          return;
        }

        pollTimer = window.setTimeout(() => {
          void tick();
        }, 1000);
      } catch (error) {
        const failedTask = {
          ...(task.value ?? {
            id: taskId,
            text: text.value,
            voiceId: selectedVoiceId.value,
            progress: 0,
            totalSentences: 1,
            completedSentences: 0,
            audioId: null,
            audioUrl: null,
            createdAt: new Date().toISOString()
          }),
          status: "failed" as const,
          errorMessage: error instanceof Error ? error.message : "轮询任务状态失败"
        };
        task.value = failedTask;
        stopPolling();
        await handlers?.onFailed?.(failedTask);
      }
    };

    await tick();
  }

  return {
    clearText,
    isSubmitting,
    isPolling,
    loadVoices,
    pollGeneration,
    selectedVoiceId,
    sentenceProgressLabel,
    stopPolling,
    submitGeneration,
    task,
    text,
    voices
  };
});

import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { GenerationTask, VoiceOption } from "@oio/contracts";

import { apiClient } from "../shared/api/client";

export const useGenerationStore = defineStore("generation", () => {
  const text = ref(
    `I remember being in this situation before where I sent a message to my friend and waited forever for a reply, but he just never responded.
I was like, "What's going on with you?"
And the weird part was that I could clearly see the message had already been read, so then my brain started going everywhere.
I kept wondering whether he was just intentionally ignoring me or if something serious had happened to him.
The whole thing felt really strange.`
  );
  const voices = ref<VoiceOption[]>([]);
  const selectedVoiceId = ref("heart");
  const task = ref<GenerationTask | null>(null);
  const isSubmitting = ref(false);

  const sentenceProgressLabel = computed(() => {
    if (!task.value) {
      return "准备开始生成音频与字幕";
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

  return {
    clearText,
    isSubmitting,
    loadVoices,
    selectedVoiceId,
    sentenceProgressLabel,
    submitGeneration,
    task,
    text,
    voices
  };
});

import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { BlankExercise, PracticeCheckResult, PracticeMode, PracticePayload } from "@oio/contracts";

import { apiClient } from "../shared/api/client";

export const usePracticeStore = defineStore("practice", () => {
  const payload = ref<PracticePayload | null>(null);
  const blankExercise = ref<BlankExercise | null>(null);
  const mode = ref<PracticeMode>("subtitle");
  const currentSentenceIndex = ref(0);
  const answers = ref<Record<string, string>>({});
  const result = ref<PracticeCheckResult | null>(null);
  const isPlaying = ref(false);
  const speed = ref(1);
  const sentenceLoop = ref(true);
  const audioLoop = ref(false);
  const currentSeconds = ref(0);

  const totalDuration = computed(() => payload.value?.audio.durationSeconds ?? 0);
  const activeSentence = computed(() => payload.value?.audio.sentences[currentSentenceIndex.value] ?? null);

  async function load(audioId: string) {
    payload.value = await apiClient.getPractice(audioId);
    blankExercise.value = payload.value.recommendedExercise;
    mode.value = "subtitle";
    currentSentenceIndex.value = 0;
    answers.value = {};
    result.value = null;
    currentSeconds.value = 0;
    isPlaying.value = false;
  }

  function setMode(nextMode: PracticeMode) {
    mode.value = nextMode;
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value;
  }

  function nextSentence() {
    if (!payload.value) {
      return;
    }

    currentSentenceIndex.value = Math.min(
      payload.value.audio.sentences.length - 1,
      currentSentenceIndex.value + 1
    );
    const nextSentenceValue = payload.value.audio.sentences[currentSentenceIndex.value];
    currentSeconds.value = nextSentenceValue ? nextSentenceValue.startMs / 1000 : 0;
  }

  function previousSentence() {
    currentSentenceIndex.value = Math.max(0, currentSentenceIndex.value - 1);
    const previousSentenceValue = payload.value?.audio.sentences[currentSentenceIndex.value];
    currentSeconds.value = previousSentenceValue ? previousSentenceValue.startMs / 1000 : 0;
  }

  async function createBlanks() {
    if (!payload.value) {
      return;
    }

    blankExercise.value = await apiClient.createBlanks(payload.value.audio.id, {
      preferredSentenceIds: payload.value.audio.sentences.map((sentence) => sentence.id)
    });
    mode.value = "fill-blanks";
    answers.value = {};
    result.value = null;
  }

  function updateAnswer(blankId: string, value: string) {
    answers.value = {
      ...answers.value,
      [blankId]: value
    };
  }

  async function checkAnswers() {
    if (!payload.value) {
      return;
    }

    result.value = await apiClient.checkPractice(payload.value.audio.id, {
      answers: answers.value
    });
  }

  function setSpeed(nextSpeed: number) {
    speed.value = nextSpeed;
  }

  function setLoops(nextSentenceLoop: boolean, nextAudioLoop: boolean) {
    sentenceLoop.value = nextSentenceLoop;
    audioLoop.value = nextAudioLoop;
  }

  function setCurrentSeconds(nextValue: number) {
    currentSeconds.value = nextValue;
  }

  return {
    activeSentence,
    answers,
    audioLoop,
    blankExercise,
    checkAnswers,
    createBlanks,
    currentSeconds,
    currentSentenceIndex,
    isPlaying,
    load,
    mode,
    nextSentence,
    payload,
    previousSentence,
    result,
    sentenceLoop,
    setCurrentSeconds,
    setLoops,
    setMode,
    setSpeed,
    speed,
    togglePlay,
    totalDuration,
    updateAnswer
  };
});

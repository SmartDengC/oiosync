import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { AudioRecord, DownloadAudioResponse } from "@oio/contracts";

import { apiClient } from "../shared/api/client";

function todaySeed() {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

export const useLibraryStore = defineStore("library", () => {
  const { year: seedYear, month: seedMonth } = todaySeed();
  const year = ref(seedYear);
  const month = ref(seedMonth);
  const records = ref<AudioRecord[]>([]);
  const highlightedDays = ref<number[]>([]);
  const selectedDay = ref<number | null>(null);
  const isLoading = ref(false);
  const lastDownload = ref<DownloadAudioResponse | null>(null);

  const filteredRecords = computed(() =>
    selectedDay.value == null ? records.value : records.value.filter((record) => record.day === selectedDay.value)
  );

  async function loadCurrentMonth() {
    isLoading.value = true;

    try {
      const payload = await apiClient.getAudios(year.value, month.value);
      records.value = payload.records;
      highlightedDays.value = payload.highlightedDays;
      if (selectedDay.value && !highlightedDays.value.includes(selectedDay.value)) {
        selectedDay.value = null;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteRecord(audioId: string) {
    await apiClient.deleteAudio(audioId);
    await loadCurrentMonth();
  }

  async function downloadRecord(audioId: string) {
    lastDownload.value = await apiClient.downloadAudio(audioId);
    return lastDownload.value;
  }

  function selectDay(day: number | null) {
    selectedDay.value = day;
  }

  function nextMonth() {
    if (month.value === 12) {
      month.value = 1;
      year.value += 1;
      return;
    }

    month.value += 1;
  }

  function previousMonth() {
    if (month.value === 1) {
      month.value = 12;
      year.value -= 1;
      return;
    }

    month.value -= 1;
  }

  return {
    deleteRecord,
    downloadRecord,
    filteredRecords,
    highlightedDays,
    isLoading,
    lastDownload,
    loadCurrentMonth,
    month,
    nextMonth,
    previousMonth,
    records,
    selectDay,
    selectedDay,
    year
  };
});

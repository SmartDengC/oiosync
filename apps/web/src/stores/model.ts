import { defineStore } from "pinia";
import { ref } from "vue";

import type { ModelInstallStatus } from "@oio/contracts";

import { apiClient } from "../shared/api/client";

export const useModelStore = defineStore("model", () => {
  const status = ref<ModelInstallStatus | null>(null);
  const isWorking = ref(false);

  async function loadStatus() {
    status.value = await apiClient.getModelStatus();
  }

  async function installToBrowser() {
    isWorking.value = true;

    try {
      status.value = await apiClient.installModel();
    } finally {
      isWorking.value = false;
    }
  }

  async function clearCache() {
    isWorking.value = true;

    try {
      status.value = await apiClient.clearModelCache();
    } finally {
      isWorking.value = false;
    }
  }

  return {
    clearCache,
    installToBrowser,
    isWorking,
    loadStatus,
    status
  };
});

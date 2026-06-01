import { defineStore } from "pinia";
import { ref } from "vue";

type Theme = "light" | "dark";

export const useAppStore = defineStore("app", () => {
  const theme = ref<Theme>("light");
  const currentAudioId = ref<string | null>(null);
  const notice = ref("");

  function applyTheme(nextTheme: Theme) {
    theme.value = nextTheme;
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("oio-theme", nextTheme);
  }

  function initTheme() {
    const cached = localStorage.getItem("oio-theme");
    applyTheme(cached === "dark" ? "dark" : "light");
  }

  function toggleTheme() {
    applyTheme(theme.value === "light" ? "dark" : "light");
  }

  function setCurrentAudio(audioId: string | null) {
    currentAudioId.value = audioId;
  }

  function pushNotice(message: string) {
    notice.value = message;
  }

  return {
    currentAudioId,
    initTheme,
    notice,
    pushNotice,
    setCurrentAudio,
    theme,
    toggleTheme
  };
});

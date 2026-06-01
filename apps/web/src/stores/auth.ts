import { defineStore } from "pinia";
import { ref } from "vue";

export const AUTH_STORAGE_KEY = "oio-auth-session";
export const DEMO_USERNAME = "oio";
export const DEMO_PASSWORD = "oio123";

type StoredSession = {
  username: string;
};

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(false);
  const username = ref<string | null>(null);
  const errorMessage = ref("");

  function clearSession() {
    isAuthenticated.value = false;
    username.value = null;
  }

  function applySession(nextUsername: string) {
    isAuthenticated.value = true;
    username.value = nextUsername;
  }

  function initSession() {
    errorMessage.value = "";

    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!cached) {
      clearSession();
      return;
    }

    try {
      const session = JSON.parse(cached) as StoredSession;
      if (session.username === DEMO_USERNAME) {
        applySession(session.username);
        return;
      }
    } catch {
      // Ignore malformed cached sessions and reset to signed-out.
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    clearSession();
  }

  function login(nextUsername: string, password: string) {
    if (nextUsername === DEMO_USERNAME && password === DEMO_PASSWORD) {
      applySession(nextUsername);
      errorMessage.value = "";
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          username: nextUsername
        } satisfies StoredSession)
      );
      return true;
    }

    errorMessage.value = "账号或密码错误";
    clearSession();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return false;
  }

  function logout() {
    errorMessage.value = "";
    clearSession();
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return {
    errorMessage,
    initSession,
    isAuthenticated,
    login,
    logout,
    username
  };
});

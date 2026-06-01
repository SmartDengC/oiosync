import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { AUTH_STORAGE_KEY, DEMO_PASSWORD, DEMO_USERNAME, useAuthStore } from "./auth";

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("logs in with the demo credentials and persists the session", () => {
    const store = useAuthStore();

    const isSuccess = store.login(DEMO_USERNAME, DEMO_PASSWORD);

    expect(isSuccess).toBe(true);
    expect(store.isAuthenticated).toBe(true);
    expect(store.username).toBe(DEMO_USERNAME);
    expect(store.errorMessage).toBe("");
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe(JSON.stringify({ username: DEMO_USERNAME }));
  });

  it("rejects invalid credentials with an error message", () => {
    const store = useAuthStore();

    const isSuccess = store.login("wrong", "creds");

    expect(isSuccess).toBe(false);
    expect(store.isAuthenticated).toBe(false);
    expect(store.username).toBeNull();
    expect(store.errorMessage).toBe("账号或密码错误");
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("restores a cached session", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username: DEMO_USERNAME }));
    const store = useAuthStore();

    store.initSession();

    expect(store.isAuthenticated).toBe(true);
    expect(store.username).toBe(DEMO_USERNAME);
    expect(store.errorMessage).toBe("");
  });

  it("clears state and storage when logging out", () => {
    const store = useAuthStore();
    store.login(DEMO_USERNAME, DEMO_PASSWORD);

    store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(store.username).toBeNull();
    expect(store.errorMessage).toBe("");
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});

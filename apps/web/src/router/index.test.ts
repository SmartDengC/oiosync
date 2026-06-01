import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestRouter } from "./index";
import { DEMO_PASSWORD, DEMO_USERNAME, useAuthStore } from "../stores/auth";

describe("router auth guard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("redirects unauthenticated users from home to login", async () => {
    const router = createTestRouter();

    await router.push("/");

    expect(router.currentRoute.value.path).toBe("/login");
    expect(router.currentRoute.value.query.redirect).toBe("/");
  });

  it("redirects unauthenticated users from practice and keeps the original target", async () => {
    const router = createTestRouter();

    await router.push("/practice/audio-42");

    expect(router.currentRoute.value.path).toBe("/login");
    expect(router.currentRoute.value.query.redirect).toBe("/practice/audio-42");
  });

  it("redirects authenticated users away from the login page", async () => {
    const router = createTestRouter();
    useAuthStore().login(DEMO_USERNAME, DEMO_PASSWORD);

    await router.push("/login");

    expect(router.currentRoute.value.fullPath).toBe("/");
  });
});

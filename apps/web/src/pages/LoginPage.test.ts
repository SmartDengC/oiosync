import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import LoginPage from "./LoginPage.vue";
import { createTestRouter } from "../router";
import { useAuthStore } from "../stores/auth";

describe("LoginPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("shows a validation error when the form is submitted empty", async () => {
    const router = createTestRouter();
    await router.push("/login");

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router]
      }
    });

    await router.isReady();
    await wrapper.get("form").trigger("submit.prevent");

    expect(wrapper.get('[data-testid="login-error"]').text()).toBe("请输入用户名");
  });

  it("redirects to the requested page after a successful login", async () => {
    const router = createTestRouter();
    await router.push("/login?redirect=/practice/audio-1");

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router]
      }
    });

    await router.isReady();
    await wrapper.get('[data-testid="login-username"]').setValue("oio");
    await wrapper.get('[data-testid="login-password"]').setValue("oio123");
    await wrapper.get("form").trigger("submit.prevent");
    await flushPromises();

    expect(useAuthStore().isAuthenticated).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe("/practice/audio-1");
  });

  it("shows an error when the credentials are incorrect", async () => {
    const router = createTestRouter();
    await router.push("/login");

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router]
      }
    });

    await router.isReady();
    await wrapper.get('[data-testid="login-username"]').setValue("someone");
    await wrapper.get('[data-testid="login-password"]').setValue("bad-password");
    await wrapper.get("form").trigger("submit.prevent");

    expect(wrapper.get('[data-testid="login-error"]').text()).toBe("账号或密码错误");
  });
});

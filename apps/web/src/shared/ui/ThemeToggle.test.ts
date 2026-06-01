import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ThemeToggle from "./ThemeToggle.vue";
import { useAppStore } from "../../stores/app";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
  });

  it("toggles theme via app store", async () => {
    const wrapper = mount(ThemeToggle, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
            initialState: {
              app: {
                theme: "light"
              }
            }
          })
        ]
      }
    });

    const store = useAppStore();
    await wrapper.get('[data-testid="theme-toggle"]').trigger("click");

    expect(store.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

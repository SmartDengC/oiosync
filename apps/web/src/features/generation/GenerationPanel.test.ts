import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { describe, expect, it, vi } from "vitest";

import GenerationPanel from "./GenerationPanel.vue";

describe("GenerationPanel", () => {
  it("disables generate action when text is empty", () => {
    const wrapper = mount(GenerationPanel, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              generation: {
                text: "",
                voices: [{ id: "heart", label: "女 · heart", gender: "female", accent: "neutral", previewText: "" }],
                selectedVoiceId: "heart",
                isSubmitting: false
              },
              app: {
                notice: ""
              }
            }
          })
        ]
      }
    });

    expect(wrapper.get('[data-testid="generate-button"]').attributes("disabled")).toBeDefined();
  });
});

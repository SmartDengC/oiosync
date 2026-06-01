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
                voices: [{ id: "Mia", label: "Mia", gender: "female", accent: "american", previewText: "" }],
                selectedVoiceId: "Mia",
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

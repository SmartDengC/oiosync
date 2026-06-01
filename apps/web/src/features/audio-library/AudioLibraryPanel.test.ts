import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { describe, expect, it, vi } from "vitest";

import AudioLibraryPanel from "./AudioLibraryPanel.vue";
import { useLibraryStore } from "../../stores/library";

describe("AudioLibraryPanel", () => {
  it("changes month through store actions", async () => {
    const wrapper = mount(AudioLibraryPanel, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              library: {
                year: 2026,
                month: 5,
                records: [],
                highlightedDays: [],
                selectedDay: null
              },
              app: {
                notice: ""
              }
            }
          })
        ]
      }
    });

    const store = useLibraryStore();
    await wrapper.get('[data-testid="month-next"]').trigger("click");
    expect(store.nextMonth).toHaveBeenCalledTimes(1);
  });
});

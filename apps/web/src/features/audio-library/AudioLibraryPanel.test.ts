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

  it("shows unavailable records and disables load and download actions", () => {
    const wrapper = mount(AudioLibraryPanel, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              library: {
                year: 2026,
                month: 5,
                records: [
                  {
                    id: "audio-1",
                    title: "audio-1",
                    summary: "summary",
                    sourceText: "summary",
                    voiceId: "Mia",
                    audioUrl: null,
                    year: 2026,
                    month: 5,
                    day: 28,
                    dateKey: "2026-05-28",
                    durationSeconds: 12,
                    status: "ready",
                    createdAt: "2026-05-28T09:00:00.000Z",
                    sentences: []
                  }
                ],
                highlightedDays: [28],
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

    const actionButtons = wrapper.findAll(".record-link");

    expect(wrapper.text()).toContain("无真实音频，请重新生成。");
    expect(actionButtons[0]?.attributes("disabled")).toBeDefined();
    expect(actionButtons[1]?.attributes("disabled")).toBeDefined();
  });
});

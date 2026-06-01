import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { describe, expect, it, vi } from "vitest";

import PracticeWorkbench from "./PracticeWorkbench.vue";
import { usePracticeStore } from "../../stores/practice";

const payload = {
  audio: {
    id: "2026-05-28-001",
    title: "2026-05-28-001",
    sourceText: "I remember being in this situation before.",
    summary: "I remember being in this situation before.",
    voiceId: "heart",
    audioUrl: null,
    year: 2026,
    month: 5,
    day: 28,
    dateKey: "2026-05-28",
    durationSeconds: 29,
    status: "ready",
    createdAt: "2026-05-28T09:00:00.000Z",
    sentences: [
      {
        id: "sentence-1",
        index: 0,
        text: "I remember being in this situation before.",
        startMs: 0,
        endMs: 6000,
        focusWords: ["remember", "situation"]
      }
    ]
  },
  recommendedExercise: {
    audioId: "2026-05-28-001",
    tokens: [
      {
        id: "sentence-1-blank-1",
        sentenceId: "sentence-1",
        answer: "remember",
        display: "________",
        indexInSentence: 1
      }
    ]
  }
};

describe("PracticeWorkbench", () => {
  it("switches modes via the practice store", async () => {
    const wrapper = mount(PracticeWorkbench, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              practice: {
                payload,
                blankExercise: payload.recommendedExercise,
                mode: "subtitle",
                currentSentenceIndex: 0,
                answers: {},
                result: null,
                isPlaying: false,
                speed: 1,
                sentenceLoop: true,
                audioLoop: false,
                currentSeconds: 0
              }
            }
          })
        ]
      }
    });

    const store = usePracticeStore();
    await wrapper.findAll('[data-testid="mode-button"]')[1].trigger("click");
    expect(store.setMode).toHaveBeenCalledWith("dictation");
  });

  it("submits fill-in checks from the practice stage", async () => {
    const wrapper = mount(PracticeWorkbench, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              practice: {
                payload,
                blankExercise: payload.recommendedExercise,
                mode: "fill-blanks",
                currentSentenceIndex: 0,
                answers: {},
                result: null,
                isPlaying: false,
                speed: 1,
                sentenceLoop: true,
                audioLoop: false,
                currentSeconds: 0
              }
            }
          })
        ]
      }
    });

    const store = usePracticeStore();
    await wrapper.get('[data-testid="check-blanks"]').trigger("click");
    expect(store.checkAnswers).toHaveBeenCalledTimes(1);
  });
});

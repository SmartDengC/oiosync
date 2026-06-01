import { describe, expect, it } from "vitest";

import { createSentenceSegments, splitTextIntoSentences } from "./sentence-segmentation";

describe("sentence segmentation", () => {
  it("splits sentences even when punctuation is not followed by a space", () => {
    expect(
      splitTextIntoSentences("The Qingming Festival has passed.Now I'm on a business trip to Shandong.")
    ).toEqual([
      "The Qingming Festival has passed.",
      "Now I'm on a business trip to Shandong."
    ]);
  });

  it("builds continuous sentence segments from provided durations", () => {
    expect(
      createSentenceSegments(["First sentence.", "Second sentence."], [1200, 1800])
    ).toEqual([
      {
        id: "sentence-1",
        index: 0,
        text: "First sentence.",
        startMs: 0,
        endMs: 1200,
        focusWords: ["First", "sentence"]
      },
      {
        id: "sentence-2",
        index: 1,
        text: "Second sentence.",
        startMs: 1200,
        endMs: 3000,
        focusWords: ["Second", "sentence"]
      }
    ]);
  });
});

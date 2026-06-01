import { describe, expect, it } from "vitest";

import {
  audioListResponseSchema,
  blankExerciseSchema,
  createGenerationRequestSchema,
  generationTaskSchema,
  modelInstallStatusSchema,
  practicePayloadSchema,
  voiceOptionSchema
} from "./index";

describe("contracts", () => {
  it("parses voice options and generation payloads", () => {
    expect(
      voiceOptionSchema.parse({
        id: "Mia",
        label: "Mia",
        gender: "female",
        accent: "american",
        previewText: "Preview"
      }).id
    ).toBe("Mia");

    expect(
      createGenerationRequestSchema.parse({
        text: "Hello world.",
        voiceId: "Mia"
      }).voiceId
    ).toBe("Mia");
  });

  it("keeps audio and practice payloads aligned", () => {
    const record = {
      id: "2026-05-28-001",
      title: "2026-05-28-001",
      sourceText: "I remember being in this situation before.",
      summary: "I remember being in this situation before.",
      voiceId: "Mia",
      audioUrl: "/generated-audio/2026-05-28-001.mp3",
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
    } as const;

    expect(generationTaskSchema.parse({
      id: "task-1",
      text: record.sourceText,
      voiceId: "Mia",
      status: "completed",
      progress: 1,
      totalSentences: 1,
      completedSentences: 1,
      audioId: record.id,
      audioUrl: record.audioUrl,
      createdAt: record.createdAt
    }).audioId).toBe(record.id);

    expect(
      generationTaskSchema.parse({
        id: "task-2",
        text: record.sourceText,
        voiceId: "Mia",
        status: "failed",
        progress: 0.5,
        totalSentences: 2,
        completedSentences: 1,
        audioId: record.id,
        audioUrl: null,
        errorMessage: "provider timeout",
        createdAt: record.createdAt
      }).status
    ).toBe("failed");

    expect(audioListResponseSchema.parse({
      year: 2026,
      month: 5,
      records: [record],
      highlightedDays: [28]
    }).records).toHaveLength(1);

    expect(
      practicePayloadSchema.parse({
        audio: record,
        recommendedExercise: blankExerciseSchema.parse({
          audioId: record.id,
          tokens: [
            {
              id: "blank-1",
              sentenceId: "sentence-1",
              answer: "remember",
              display: "________",
              indexInSentence: 1
            }
          ]
        })
      }).audio.id
    ).toBe(record.id);
  });

  it("validates model installation snapshots", () => {
    expect(
      modelInstallStatusSchema.parse({
        installed: true,
        status: "installed",
        progress: 1,
        message: "Installed",
        steps: [
          { id: "download", label: "下载模型包", done: true },
          { id: "cache", label: "写入浏览器缓存", done: true }
        ]
      }).steps.every((step) => step.done)
    ).toBe(true);
  });
});

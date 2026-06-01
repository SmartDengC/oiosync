import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "./app";
import {
  audioRecords,
  createExercise,
  createGeneratedAudio,
  generationTasks,
  getPractice,
  installModel,
  modelStatus,
  removeAudio,
  resetModelCache
} from "./data";

describe("mock api", () => {
  beforeEach(() => {
    installModel();
  });

  it("registers the planned REST endpoints", () => {
    const app = createApp();
    const routes = (app as { _router?: { stack?: Array<{ route?: { path?: string } }> } })._router?.stack ?? [];
    const paths = routes
      .map((layer) => layer.route?.path)
      .filter((path): path is string => typeof path === "string");

    expect(paths).toContain("/api/voices");
    expect(paths).toContain("/api/generations");
    expect(paths).toContain("/api/model/status");
    expect(paths).toContain("/api/audios");
    expect(paths).toContain("/api/audios/import");
    expect(paths).toContain("/api/practice/:audioId/check");
  });

  it("creates generation tasks and exposes practice payloads", () => {
    const initialRecordCount = audioRecords.length;
    const task = createGeneratedAudio("This is a generated sample. It becomes a practice item.", "heart");

    expect(task.audioId).toBeTruthy();
    expect(generationTasks[0]?.id).toBe(task.id);
    expect(audioRecords.length).toBe(initialRecordCount + 1);

    const practicePayload = getPractice(task.audioId as string);
    expect(practicePayload?.audio.sentences.length).toBeGreaterThan(0);
    expect(practicePayload?.recommendedExercise.tokens.length).toBeGreaterThan(0);
  });

  it("supports model transitions and audio lifecycle helpers", () => {
    resetModelCache();
    expect(modelStatus.installed).toBe(false);

    installModel();
    expect(modelStatus.installed).toBe(true);

    const audioId = audioRecords[0]?.id;
    const exercise = createExercise(audioId);
    expect(exercise?.tokens.length).toBeGreaterThan(0);
    expect(removeAudio(audioId)).toBe(true);
  });
});

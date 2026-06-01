import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient, resolveApiPath, resolveAssetUrl } from "./client";

const practicePayload = {
  audio: {
    id: "audio-1",
    title: "Audio 1",
    sourceText: "I remember being in this situation before.",
    summary: "I remember being in this situation before.",
    voiceId: "Mia",
    audioUrl: "/generated-audio/audio-1.wav",
    year: 2026,
    month: 6,
    day: 1,
    dateKey: "2026-06-01",
    durationSeconds: 29,
    status: "ready",
    createdAt: "2026-06-01T09:00:00.000Z",
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
    audioId: "audio-1",
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

describe("api client url resolution", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps relative api and asset paths when no api base url is configured", () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    expect(resolveApiPath("/api/voices")).toBe("/api/voices");
    expect(resolveAssetUrl("/generated-audio/audio-1.wav")).toBe("/generated-audio/audio-1.wav");
  });

  it("prefixes api and asset paths with the configured api origin", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/");

    expect(resolveApiPath("/api/voices")).toBe("https://api.example.com/api/voices");
    expect(resolveAssetUrl("/generated-audio/audio-1.wav")).toBe("https://api.example.com/generated-audio/audio-1.wav");
    expect(resolveAssetUrl("https://cdn.example.com/audio-1.wav")).toBe("https://cdn.example.com/audio-1.wav");
  });

  it("keeps a configured path prefix for api and asset paths", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://132.232.242.223/oiosync/");

    expect(resolveApiPath("/api/voices")).toBe("http://132.232.242.223/oiosync/api/voices");
    expect(resolveAssetUrl("/generated-audio/audio-1.wav")).toBe(
      "http://132.232.242.223/oiosync/generated-audio/audio-1.wav"
    );
  });

  it("normalizes practice audio urls against the configured api origin", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => practicePayload
    } as Response);

    const payload = await apiClient.getPractice("audio-1");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/practice/audio-1",
      expect.objectContaining({ method: "GET" })
    );
    expect(payload.audio.audioUrl).toBe("https://api.example.com/generated-audio/audio-1.wav");
  });

  it("normalizes download urls against the configured api origin", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        filename: "audio-1.wav",
        url: "/mock-downloads/audio-1.wav"
      })
    } as Response);

    const download = await apiClient.downloadAudio("audio-1");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/audios/audio-1/download",
      expect.objectContaining({ method: "GET" })
    );
    expect(download.url).toBe("https://api.example.com/mock-downloads/audio-1.wav");
  });

  it("normalizes practice audio urls against a configured path prefix", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://132.232.242.223/oiosync");
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => practicePayload
    } as Response);

    const payload = await apiClient.getPractice("audio-1");

    expect(fetch).toHaveBeenCalledWith(
      "http://132.232.242.223/oiosync/api/practice/audio-1",
      expect.objectContaining({ method: "GET" })
    );
    expect(payload.audio.audioUrl).toBe("http://132.232.242.223/oiosync/generated-audio/audio-1.wav");
  });
});

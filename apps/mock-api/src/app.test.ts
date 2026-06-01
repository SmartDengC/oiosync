import { setTimeout as delay } from "node:timers/promises";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "./app";
import {
  createExercise,
  createGeneratedAudio,
  getPractice,
  installModel,
  modelStatus,
  resetRuntimeData,
  removeAudio,
  resetModelCache
} from "./data";

type MockResponse = {
  body: unknown;
  statusCode: number;
  json: (payload: unknown) => MockResponse;
  send: (payload?: unknown) => MockResponse;
  status: (code: number) => MockResponse;
};

function createSilentWavBytes() {
  const sampleRate = 8000;
  const channels = 1;
  const bitsPerSample = 8;
  const durationSeconds = 1;
  const dataLength = sampleRate * channels * durationSeconds;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const encoder = new TextEncoder();

  bytes.set(encoder.encode("RIFF"), 0);
  view.setUint32(4, 36 + dataLength, true);
  bytes.set(encoder.encode("WAVE"), 8);
  bytes.set(encoder.encode("fmt "), 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  bytes.set(encoder.encode("data"), 36);
  view.setUint32(40, dataLength, true);
  bytes.fill(128, 44);

  return Buffer.from(bytes).toString("base64");
}

function createMockResponse(): MockResponse {
  return {
    body: undefined,
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    send(payload?: unknown) {
      this.body = payload;
      return this;
    }
  };
}

function getRouteHandler(app: ReturnType<typeof createApp>, method: "get" | "post", path: string) {
  const layer = (
    (app as { _router?: { stack?: Array<{ route?: { path?: string; methods?: Record<string, boolean>; stack?: Array<{ handle: Function }> } }> } })
      ._router?.stack ?? []
  ).find((candidate) => candidate.route?.path === path && candidate.route?.methods?.[method]);

  const handler = layer?.route?.stack?.[0]?.handle;
  if (!handler) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return handler as (request: { body?: unknown; params?: Record<string, string> }, response: MockResponse) => Promise<void> | void;
}

describe("mock api", () => {
  beforeEach(() => {
    installModel();
    resetRuntimeData();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.MIMO_API_KEY;
    delete process.env.MIMO_TTS_MODEL;
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

  it("returns a processing task immediately and completes generation in the background", async () => {
    process.env.MIMO_API_KEY = "test-key";
    const wavBase64 = createSilentWavBytes();
    const app = createApp();
    const postGeneration = getRouteHandler(app, "post", "/api/generations");
    const getGeneration = getRouteHandler(app, "get", "/api/generations/:id");
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      await delay(80);
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                audio: {
                  data: wavBase64
                }
              }
            }
          ]
        })
      } as Response;
    });

    const startedAt = performance.now();
    const createResponse = createMockResponse();
    await postGeneration(
      {
        body: {
          text: "The Qingming Festival has passed. Now I'm on a business trip to Shandong.",
          voiceId: "Mia"
        }
      },
      createResponse
    );
    const elapsedMs = performance.now() - startedAt;

    expect(createResponse.statusCode).toBe(202);
    expect(elapsedMs).toBeLessThan(200);
    const createdTask = createResponse.body as {
      id: string;
      status: string;
      audioId: string;
      totalSentences: number;
      completedSentences: number;
    };
    expect(createdTask.status).toBe("processing");
    expect(createdTask.completedSentences).toBe(0);

    const processingResponse = createMockResponse();
    await getGeneration({ params: { id: createdTask.id } }, processingResponse);
    expect((processingResponse.body as { status: string }).status).toBe("processing");

    await delay(220);

    const completedResponse = createMockResponse();
    await getGeneration({ params: { id: createdTask.id } }, completedResponse);
    const completedTask = completedResponse.body as {
      status: string;
      completedSentences: number;
      totalSentences: number;
      audioUrl: string | null;
    };
    expect(completedTask.status).toBe("completed");
    expect(completedTask.completedSentences).toBe(completedTask.totalSentences);
    expect(completedTask.audioUrl).toMatch(/^\/generated-audio\//);
  });

  it("marks generation tasks as failed when TTS generation throws", async () => {
    process.env.MIMO_API_KEY = "test-key";
    const app = createApp();
    const postGeneration = getRouteHandler(app, "post", "/api/generations");
    const getGeneration = getRouteHandler(app, "get", "/api/generations/:id");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      text: async () => "provider timeout"
    } as Response);

    const createResponse = createMockResponse();
    await postGeneration(
      {
        body: {
          text: "This request will fail.",
          voiceId: "Milo"
        }
      },
      createResponse
    );

    await delay(60);

    const failedResponse = createMockResponse();
    await getGeneration({ params: { id: (createResponse.body as { id: string }).id } }, failedResponse);
    const failedTask = failedResponse.body as { status: string; errorMessage?: string };

    expect(failedTask.status).toBe("failed");
    expect(failedTask.errorMessage).toContain("provider timeout");
  });

  it("supports model transitions and audio lifecycle helpers", () => {
    resetModelCache();
    expect(modelStatus.installed).toBe(false);

    installModel();
    expect(modelStatus.installed).toBe(true);

    const task = createGeneratedAudio("This is another generated sample.", "Milo");
    const audioId = task.audioId ?? "";
    const exercise = createExercise(audioId);
    expect(exercise?.tokens.length).toBeGreaterThan(0);
    expect(getPractice(audioId)?.audio.status).toBe("ready");
    expect(removeAudio(audioId)).toBe(true);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { isTtsEnabled, synthesizeSpeech } from "./tts";

describe("tts provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.MIMO_API_KEY;
    delete process.env.MIMO_TTS_MODEL;
  });

  it("falls back when no MiMo api key is configured", async () => {
    expect(isTtsEnabled()).toBe(false);
    await expect(synthesizeSpeech("hello", "heart")).resolves.toBeNull();
  });

  it("calls MiMo TTS with expected request shape and decodes base64 audio", async () => {
    process.env.MIMO_API_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              audio: {
                data: Buffer.from("RIFFTEST", "utf8").toString("base64")
              }
            }
          }
        ]
      })
    } as Response);

    const audioBytes = await synthesizeSpeech("Hello world", "brook");
    expect(audioBytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(audioBytes ?? []).toString("utf8")).toBe("RIFFTEST");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.xiaomimimo.com/v1/chat/completions");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "api-key": "test-key",
      "Content-Type": "application/json"
    });

    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("mimo-v2-tts");
    expect(body.audio).toEqual({
      format: "wav",
      voice: "default_en"
    });
    expect(body.messages).toEqual([
      {
        role: "assistant",
        content: "<style>Steady Natural</style>Hello world"
      }
    ]);
  });
});

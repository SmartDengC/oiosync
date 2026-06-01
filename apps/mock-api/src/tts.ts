type TtsProviderVoice = {
  mimoVoice: string;
  stylePrefix: string;
};

type MimoTtsResponse = {
  choices?: Array<{
    message?: {
      audio?: {
        data?: string;
      };
    };
  }>;
};

const voiceMap: Record<string, TtsProviderVoice> = {
  heart: {
    mimoVoice: "default_en",
    stylePrefix: "<style>Warm Calm</style>"
  },
  brook: {
    mimoVoice: "default_en",
    stylePrefix: "<style>Steady Natural</style>"
  },
  halo: {
    mimoVoice: "default_en",
    stylePrefix: "<style>Clear Balanced</style>"
  }
};

export function isTtsEnabled() {
  return Boolean(process.env.MIMO_API_KEY);
}

export async function synthesizeSpeech(input: string, voiceId: string) {
  const apiKey = process.env.MIMO_API_KEY;

  if (!apiKey) {
    return null;
  }

  const providerVoice = voiceMap[voiceId] ?? voiceMap.heart;
  const response = await fetch("https://api.xiaomimimo.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.MIMO_TTS_MODEL ?? "mimo-v2-tts",
      messages: [
        {
          role: "assistant",
          content: `${providerVoice.stylePrefix}${input}`
        }
      ],
      audio: {
        format: "wav",
        voice: providerVoice.mimoVoice
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiMo TTS request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as MimoTtsResponse;
  const encodedAudio = payload.choices?.[0]?.message?.audio?.data;

  if (!encodedAudio) {
    throw new Error("MiMo TTS response did not include audio data");
  }

  return Uint8Array.from(Buffer.from(encodedAudio, "base64"));
}

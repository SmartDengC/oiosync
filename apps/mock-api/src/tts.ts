type TtsProviderVoice = {
  mimoVoice: string;
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
  Mia: {
    mimoVoice: "Mia"
  },
  Chloe: {
    mimoVoice: "Chloe"
  },
  Milo: {
    mimoVoice: "Milo"
  },
  Dean: {
    mimoVoice: "Dean"
  }
};

export function isTtsEnabled() {
  return Boolean(process.env.MIMO_API_KEY);
}

async function requestSpeechSegment(input: string, voiceId: string) {
  const apiKey = process.env.MIMO_API_KEY;

  if (!apiKey) {
    return null;
  }

  const providerVoice = voiceMap[voiceId] ?? voiceMap.Mia;
  const response = await fetch("https://api.xiaomimimo.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.MIMO_TTS_MODEL ?? "mimo-v2.5-tts",
      messages: [
        {
          role: "assistant",
          content: input
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

export async function synthesizeSpeech(input: string, voiceId: string) {
  return requestSpeechSegment(input, voiceId);
}

export async function synthesizeSpeechSegments(
  sentences: string[],
  voiceId: string,
  onProgress?: (completedSentences: number, totalSentences: number) => void
) {
  const apiKey = process.env.MIMO_API_KEY;

  if (!apiKey) {
    return null;
  }

  const outputs: Uint8Array[] = [];
  for (const [index, sentence] of sentences.entries()) {
    const audioBytes = await requestSpeechSegment(sentence, voiceId);
    if (!audioBytes) {
      return null;
    }
    outputs.push(audioBytes);
    onProgress?.(index + 1, sentences.length);
  }

  return outputs;
}

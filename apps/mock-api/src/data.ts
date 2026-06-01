import type {
  AudioRecord,
  BlankExercise,
  GenerationTask,
  ModelInstallStatus,
  SentenceSegment,
  VoiceOption
} from "@oio/contracts";

const seedText = `I remember being in this situation before where I sent a message to my friend and waited forever for a reply, but he just never responded.
I was like, "What's going on with you?"
And the weird part was that I could clearly see the message had already been read, so then my brain started going everywhere.
I kept wondering whether he was just intentionally ignoring me or if something serious had happened to him.
The whole thing felt really strange.`;

function chunkSentences(text: string): SentenceSegment[] {
  const rawSentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  let startMs = 0;

  return rawSentences.map((sentence, index) => {
    const duration = Math.max(4200, sentence.length * 55);
    const words = sentence
      .replace(/[^a-zA-Z\s']/g, "")
      .split(/\s+/)
      .filter((word) => word.length >= 5)
      .slice(0, 3);

    const segment = {
      id: `sentence-${index + 1}`,
      index,
      text: sentence,
      startMs,
      endMs: startMs + duration,
      focusWords: words
    };

    startMs += duration;
    return segment;
  });
}

export function summarize(text: string): string {
  return text.length > 78 ? `${text.slice(0, 75)}...` : text;
}

function buildRecord(
  id: string,
  createdAt: string,
  text: string,
  voiceId: string,
  audioUrl: string | null = null
): AudioRecord {
  const date = new Date(createdAt);
  const sentences = chunkSentences(text);
  const durationSeconds = Math.round(
    sentences.reduce((total, item) => total + (item.endMs - item.startMs), 0) / 1000
  );

  return {
    id,
    title: id,
    sourceText: text,
    summary: summarize(text),
    voiceId,
    audioUrl,
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    dateKey: createdAt.slice(0, 10),
    durationSeconds,
    status: "ready",
    createdAt,
    sentences
  };
}

function buildRecommendedExercise(audio: AudioRecord): BlankExercise {
  return {
    audioId: audio.id,
    tokens: audio.sentences.flatMap((sentence) =>
      sentence.focusWords.slice(0, 2).map((word, index) => ({
        id: `${sentence.id}-blank-${index + 1}`,
        sentenceId: sentence.id,
        answer: word,
        display: "________",
        indexInSentence: sentence.text
          .replace(/[^a-zA-Z\s']/g, "")
          .split(/\s+/)
          .findIndex((token) => token.toLowerCase() === word.toLowerCase())
      }))
    )
  };
}

export const voices: VoiceOption[] = [
  {
    id: "heart",
    label: "女 · heart",
    gender: "female",
    accent: "neutral",
    previewText: "Warm and reflective delivery"
  },
  {
    id: "brook",
    label: "男 · brook",
    gender: "male",
    accent: "american",
    previewText: "Steady narration for practice"
  },
  {
    id: "halo",
    label: "中性 · halo",
    gender: "neutral",
    accent: "british",
    previewText: "Balanced tone for subtitle study"
  }
];

export let modelStatus: ModelInstallStatus = {
  installed: true,
  status: "installed",
  progress: 1,
  message: "检测到本浏览器已缓存该模型，可直接点击生成音频。",
  steps: [
    { id: "download", label: "下载模型包", done: true },
    { id: "cache", label: "写入浏览器缓存", done: true },
    { id: "verify", label: "校验模型状态", done: true }
  ]
};

const seededDates = [
  "2026-05-28T09:00:00.000Z",
  "2026-05-28T09:10:00.000Z",
  "2026-05-28T09:20:00.000Z",
  "2026-05-28T09:30:00.000Z",
  "2026-05-29T09:15:00.000Z",
  "2026-05-30T09:25:00.000Z"
];

export let audioRecords: AudioRecord[] = seededDates.map((createdAt, index) =>
  buildRecord(`2026-05-28-00${index + 1}`, createdAt, seedText, index % 2 === 0 ? "heart" : "brook")
);

export let generationTasks: GenerationTask[] = audioRecords.map((record, index) => ({
  id: `task-seed-${index + 1}`,
  text: record.sourceText,
  voiceId: record.voiceId,
  status: "completed",
  progress: 1,
  totalSentences: record.sentences.length,
  completedSentences: record.sentences.length,
  audioId: record.id,
  createdAt: record.createdAt
}));

export function nextAudioId(date = new Date()): string {
  const dateKey = date.toISOString().slice(0, 10);
  const countForDate = audioRecords.filter((item) => item.dateKey === dateKey).length + 1;
  return `${dateKey}-${String(countForDate).padStart(3, "0")}`;
}

export function createGeneratedAudio(
  text: string,
  voiceId: string,
  options?: {
    audioId?: string;
    audioUrl?: string | null;
    createdAt?: string;
  }
): GenerationTask {
  const createdAt = options?.createdAt ?? new Date().toISOString();
  const audioId = options?.audioId ?? nextAudioId(new Date(createdAt));
  const audioUrl = options?.audioUrl ?? null;
  const record = buildRecord(audioId, createdAt, text, voiceId, audioUrl);

  const task: GenerationTask = {
    id: `task-${Date.now()}`,
    text,
    voiceId,
    status: "completed",
    progress: 1,
    totalSentences: record.sentences.length,
    completedSentences: record.sentences.length,
    audioId: record.id,
    audioUrl: record.audioUrl,
    createdAt
  };

  audioRecords = [record, ...audioRecords];
  generationTasks = [task, ...generationTasks];
  return task;
}

export function importAudio(title: string, sourceText: string): AudioRecord {
  const createdAt = new Date().toISOString();
  const id = nextAudioId(new Date(createdAt));
  const record = buildRecord(title ? `${id}` : id, createdAt, sourceText, "halo", null);

  audioRecords = [
    {
      ...record,
      title: title || id
    },
    ...audioRecords
  ];

  return audioRecords[0];
}

export function getAudio(audioId: string): AudioRecord | undefined {
  return audioRecords.find((record) => record.id === audioId);
}

export function getPractice(audioId: string) {
  const audio = getAudio(audioId);

  if (!audio) {
    return undefined;
  }

  return {
    audio,
    recommendedExercise: buildRecommendedExercise(audio)
  };
}

export function createExercise(audioId: string, sentenceIds?: string[]): BlankExercise | undefined {
  const payload = getPractice(audioId);

  if (!payload) {
    return undefined;
  }

  if (!sentenceIds || sentenceIds.length === 0) {
    return payload.recommendedExercise;
  }

  return {
    audioId,
    tokens: payload.recommendedExercise.tokens.filter((token) => sentenceIds.includes(token.sentenceId))
  };
}

export function removeAudio(audioId: string): boolean {
  const before = audioRecords.length;
  audioRecords = audioRecords.filter((record) => record.id !== audioId);
  generationTasks = generationTasks.filter((task) => task.audioId !== audioId);
  return audioRecords.length < before;
}

export function resetModelCache() {
  modelStatus = {
    installed: false,
    status: "not-installed",
    progress: 0,
    message: "模型缓存已清除，可重新安装到浏览器。",
    steps: [
      { id: "download", label: "下载模型包", done: false },
      { id: "cache", label: "写入浏览器缓存", done: false },
      { id: "verify", label: "校验模型状态", done: false }
    ]
  };
}

export function installModel() {
  modelStatus = {
    installed: true,
    status: "installed",
    progress: 1,
    message: "模型已安装完成，可直接生成音频。",
    steps: [
      { id: "download", label: "下载模型包", done: true },
      { id: "cache", label: "写入浏览器缓存", done: true },
      { id: "verify", label: "校验模型状态", done: true }
    ]
  };
}

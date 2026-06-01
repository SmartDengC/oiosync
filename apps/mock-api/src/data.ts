import type {
  AudioRecord,
  BlankExercise,
  GenerationTask,
  ModelInstallStatus,
  SentenceSegment,
  VoiceOption
} from "@oio/contracts";

import { loadPersistedState, persistState } from "./record-storage";
import { createSentenceSegments, splitTextIntoSentences } from "./sentence-segmentation";

function chunkSentences(text: string): SentenceSegment[] {
  return createSentenceSegments(splitTextIntoSentences(text));
}

export function summarize(text: string): string {
  return text.length > 78 ? `${text.slice(0, 75)}...` : text;
}

function buildRecord(
  id: string,
  createdAt: string,
  text: string,
  voiceId: string,
  audioUrl: string | null = null,
  sentences = chunkSentences(text),
  status: AudioRecord["status"] = "ready"
): AudioRecord {
  const date = new Date(createdAt);
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
    status,
    createdAt,
    sentences
  };
}

function buildTask(
  id: string,
  text: string,
  voiceId: string,
  createdAt: string,
  audioId: string,
  totalSentences: number,
  options?: {
    status?: GenerationTask["status"];
    progress?: number;
    completedSentences?: number;
    audioUrl?: string | null;
    errorMessage?: string;
  }
): GenerationTask {
  return {
    id,
    text,
    voiceId,
    status: options?.status ?? "processing",
    progress: options?.progress ?? 0,
    totalSentences,
    completedSentences: options?.completedSentences ?? 0,
    audioId,
    audioUrl: options?.audioUrl ?? null,
    errorMessage: options?.errorMessage,
    createdAt
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
    id: "Mia",
    label: "Mia",
    gender: "female",
    accent: "american",
    previewText: "Warm and natural English narration"
  },
  {
    id: "Chloe",
    label: "Chloe",
    gender: "female",
    accent: "american",
    previewText: "Bright and expressive English voice"
  },
  {
    id: "Milo",
    label: "Milo",
    gender: "male",
    accent: "american",
    previewText: "Steady English practice narration"
  },
  {
    id: "Dean",
    label: "Dean",
    gender: "male",
    accent: "british",
    previewText: "Clear and balanced English delivery"
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

const persistedState = loadPersistedState();

export let audioRecords: AudioRecord[] = persistedState.audioRecords;

export let generationTasks: GenerationTask[] = persistedState.generationTasks;

function saveRuntimeState() {
  persistState({
    audioRecords,
    generationTasks
  });
}

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
    sentences?: SentenceSegment[];
  }
): GenerationTask {
  const createdAt = options?.createdAt ?? new Date().toISOString();
  const audioId = options?.audioId ?? nextAudioId(new Date(createdAt));
  const audioUrl = options?.audioUrl ?? null;
  const record = buildRecord(audioId, createdAt, text, voiceId, audioUrl, options?.sentences ?? chunkSentences(text));
  const task = buildTask(
    `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    voiceId,
    createdAt,
    record.id,
    record.sentences.length,
    {
      status: "completed",
      progress: 1,
      completedSentences: record.sentences.length,
      audioUrl: record.audioUrl
    }
  );

  audioRecords = [record, ...audioRecords];
  generationTasks = [task, ...generationTasks];
  saveRuntimeState();
  return task;
}

export function createPendingGeneration(
  text: string,
  voiceId: string,
  options?: {
    audioId?: string;
    createdAt?: string;
    sentences?: SentenceSegment[];
  }
): GenerationTask {
  const createdAt = options?.createdAt ?? new Date().toISOString();
  const audioId = options?.audioId ?? nextAudioId(new Date(createdAt));
  const sentences = options?.sentences ?? chunkSentences(text);
  const record = buildRecord(audioId, createdAt, text, voiceId, null, sentences, "processing");
  const task = buildTask(
    `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    voiceId,
    createdAt,
    audioId,
    sentences.length,
    {
      status: "processing",
      progress: 0,
      completedSentences: 0
    }
  );

  audioRecords = [record, ...audioRecords];
  generationTasks = [task, ...generationTasks];
  saveRuntimeState();
  return task;
}

export function importAudio(title: string, sourceText: string): AudioRecord {
  const createdAt = new Date().toISOString();
  const id = nextAudioId(new Date(createdAt));
  const record = buildRecord(title ? `${id}` : id, createdAt, sourceText, "Mia", null);

  audioRecords = [
    {
      ...record,
      title: title || id
    },
    ...audioRecords
  ];
  saveRuntimeState();

  return audioRecords[0];
}

export function getAudio(audioId: string): AudioRecord | undefined {
  return audioRecords.find((record) => record.id === audioId);
}

export function getGenerationTask(taskId: string): GenerationTask | undefined {
  return generationTasks.find((task) => task.id === taskId);
}

export function updateGenerationProgress(taskId: string, completedSentences: number) {
  const task = getGenerationTask(taskId);

  if (!task || task.status === "failed" || task.status === "completed") {
    return;
  }

  const safeCompletedSentences = Math.min(task.totalSentences, Math.max(0, completedSentences));
  Object.assign(task, {
    status: "processing",
    completedSentences: safeCompletedSentences,
    progress: safeCompletedSentences / task.totalSentences
  });
  saveRuntimeState();
}

export function completeGenerationTask(
  taskId: string,
  options: {
    audioUrl: string | null;
    sentences: SentenceSegment[];
  }
) {
  const task = getGenerationTask(taskId);

  if (!task) {
    return;
  }

  Object.assign(task, {
    status: "completed",
    progress: 1,
    completedSentences: task.totalSentences,
    audioUrl: options.audioUrl,
    errorMessage: undefined
  });

  const record = task.audioId ? getAudio(task.audioId) : undefined;
  if (record) {
    const durationSeconds = Math.round(
      options.sentences.reduce((total, item) => total + (item.endMs - item.startMs), 0) / 1000
    );
    Object.assign(record, {
      audioUrl: options.audioUrl,
      sentences: options.sentences,
      durationSeconds,
      status: "ready"
    });
  }

  saveRuntimeState();
}

export function failGenerationTask(taskId: string, errorMessage: string) {
  const task = getGenerationTask(taskId);

  if (!task) {
    return;
  }

  Object.assign(task, {
    status: "failed",
    errorMessage
  });

  if (task.audioId) {
    audioRecords = audioRecords.filter((record) => record.id !== task.audioId);
  }

  saveRuntimeState();
}

export function getPractice(audioId: string) {
  const audio = getAudio(audioId);

  if (!audio || audio.status !== "ready" || !audio.audioUrl) {
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
  const removed = audioRecords.length < before;

  if (removed) {
    saveRuntimeState();
  }

  return removed;
}

export function resetRuntimeData() {
  audioRecords = [];
  generationTasks = [];
  saveRuntimeState();
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

import { z } from "zod";

export const practiceModeSchema = z.enum([
  "subtitle",
  "dictation",
  "create-blanks",
  "fill-blanks"
]);

export const voiceOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  gender: z.enum(["female", "male", "neutral"]),
  accent: z.string(),
  previewText: z.string()
});

export const sentenceSegmentSchema = z.object({
  id: z.string(),
  index: z.number().int().nonnegative(),
  text: z.string(),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  focusWords: z.array(z.string())
});

export const generationTaskSchema = z.object({
  id: z.string(),
  text: z.string(),
  voiceId: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number().min(0).max(1),
  totalSentences: z.number().int().positive(),
  completedSentences: z.number().int().nonnegative(),
  audioId: z.string().nullable(),
  audioUrl: z.string().nullable().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string()
});

export const audioRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceText: z.string(),
  summary: z.string(),
  voiceId: z.string(),
  audioUrl: z.string().nullable(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  dateKey: z.string(),
  durationSeconds: z.number().positive(),
  status: z.enum(["ready", "processing"]),
  createdAt: z.string(),
  sentences: z.array(sentenceSegmentSchema)
});

export const modelStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean()
});

export const modelInstallStatusSchema = z.object({
  installed: z.boolean(),
  status: z.enum(["not-installed", "installing", "installed"]),
  progress: z.number().min(0).max(1),
  message: z.string(),
  steps: z.array(modelStepSchema)
});

export const blankTokenSchema = z.object({
  id: z.string(),
  sentenceId: z.string(),
  answer: z.string(),
  display: z.string(),
  indexInSentence: z.number().int().nonnegative()
});

export const blankExerciseSchema = z.object({
  audioId: z.string(),
  tokens: z.array(blankTokenSchema)
});

export const practiceCheckItemSchema = z.object({
  blankId: z.string(),
  expected: z.string(),
  received: z.string(),
  correct: z.boolean()
});

export const practiceCheckResultSchema = z.object({
  total: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  items: z.array(practiceCheckItemSchema)
});

export const practicePayloadSchema = z.object({
  audio: audioRecordSchema,
  recommendedExercise: blankExerciseSchema
});

export const createGenerationRequestSchema = z.object({
  text: z.string().min(1),
  voiceId: z.string().min(1)
});

export const importAudioRequestSchema = z.object({
  title: z.string().min(1).default("Imported audio"),
  sourceText: z.string().min(1)
});

export const createBlankExerciseRequestSchema = z.object({
  preferredSentenceIds: z.array(z.string()).optional()
});

export const checkPracticeRequestSchema = z.object({
  answers: z.record(z.string())
});

export const audioListResponseSchema = z.object({
  year: z.number().int(),
  month: z.number().int(),
  records: z.array(audioRecordSchema),
  highlightedDays: z.array(z.number().int())
});

export const downloadAudioResponseSchema = z.object({
  filename: z.string(),
  url: z.string()
});

export const API_PATHS = {
  voices: "/api/voices",
  generations: "/api/generations",
  modelStatus: "/api/model/status",
  modelInstall: "/api/model/install",
  modelCache: "/api/model/cache",
  audios: "/api/audios",
  practice: "/api/practice"
} as const;

export type PracticeMode = z.infer<typeof practiceModeSchema>;
export type VoiceOption = z.infer<typeof voiceOptionSchema>;
export type SentenceSegment = z.infer<typeof sentenceSegmentSchema>;
export type GenerationTask = z.infer<typeof generationTaskSchema>;
export type AudioRecord = z.infer<typeof audioRecordSchema>;
export type ModelInstallStatus = z.infer<typeof modelInstallStatusSchema>;
export type BlankToken = z.infer<typeof blankTokenSchema>;
export type BlankExercise = z.infer<typeof blankExerciseSchema>;
export type PracticeCheckResult = z.infer<typeof practiceCheckResultSchema>;
export type PracticePayload = z.infer<typeof practicePayloadSchema>;
export type CreateGenerationRequest = z.infer<typeof createGenerationRequestSchema>;
export type ImportAudioRequest = z.infer<typeof importAudioRequestSchema>;
export type CreateBlankExerciseRequest = z.infer<typeof createBlankExerciseRequestSchema>;
export type CheckPracticeRequest = z.infer<typeof checkPracticeRequestSchema>;
export type AudioListResponse = z.infer<typeof audioListResponseSchema>;
export type DownloadAudioResponse = z.infer<typeof downloadAudioResponseSchema>;

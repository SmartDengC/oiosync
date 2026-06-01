import {
  API_PATHS,
  type AudioListResponse,
  type AudioRecord,
  type BlankExercise,
  type CheckPracticeRequest,
  type CreateBlankExerciseRequest,
  type CreateGenerationRequest,
  type DownloadAudioResponse,
  type GenerationTask,
  type ImportAudioRequest,
  type ModelInstallStatus,
  type PracticeCheckResult,
  type PracticePayload,
  type VoiceOption,
  audioListResponseSchema,
  audioRecordSchema,
  blankExerciseSchema,
  downloadAudioResponseSchema,
  generationTaskSchema,
  modelInstallStatusSchema,
  practiceCheckResultSchema,
  practicePayloadSchema,
  voiceOptionSchema
} from "@oio/contracts";

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

export function resolveApiPath(path: string): string {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl === "") {
    return path;
  }

  return path.startsWith("/") ? `${apiBaseUrl}${path}` : `${apiBaseUrl}/${path}`;
}

export function resolveAssetUrl(pathOrUrl: string | null | undefined): string | null | undefined {
  const apiBaseUrl = getApiBaseUrl();

  if (!pathOrUrl || apiBaseUrl === "") {
    return pathOrUrl;
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, `${apiBaseUrl}/`).toString();
}

function normalizeAudioRecord(record: AudioRecord): AudioRecord {
  return {
    ...record,
    audioUrl: resolveAssetUrl(record.audioUrl) ?? null
  };
}

function normalizeGenerationTask(task: GenerationTask): GenerationTask {
  return {
    ...task,
    audioUrl: resolveAssetUrl(task.audioUrl) ?? null
  };
}

function normalizeAudioListResponse(payload: AudioListResponse): AudioListResponse {
  return {
    ...payload,
    records: payload.records.map(normalizeAudioRecord)
  };
}

function normalizeDownloadAudioResponse(payload: DownloadAudioResponse): DownloadAudioResponse {
  return {
    ...payload,
    url: resolveAssetUrl(payload.url) ?? payload.url
  };
}

function normalizePracticePayload(payload: PracticePayload): PracticePayload {
  return {
    ...payload,
    audio: normalizeAudioRecord(payload.audio)
  };
}

async function requestJson<T>(input: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  const response = await fetch(resolveApiPath(input), {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return parse(await response.json());
}

export const apiClient = {
  async getVoices(): Promise<VoiceOption[]> {
    return requestJson(API_PATHS.voices, { method: "GET" }, (data) => voiceOptionSchema.array().parse(data));
  },
  async createGeneration(payload: CreateGenerationRequest): Promise<GenerationTask> {
    return requestJson(
      API_PATHS.generations,
      { method: "POST", body: JSON.stringify(payload) },
      (data) => normalizeGenerationTask(generationTaskSchema.parse(data))
    );
  },
  async getGeneration(taskId: string): Promise<GenerationTask> {
    return requestJson(`${API_PATHS.generations}/${taskId}`, { method: "GET" }, (data) =>
      normalizeGenerationTask(generationTaskSchema.parse(data))
    );
  },
  async getModelStatus(): Promise<ModelInstallStatus> {
    return requestJson(API_PATHS.modelStatus, { method: "GET" }, (data) => modelInstallStatusSchema.parse(data));
  },
  async installModel(): Promise<ModelInstallStatus> {
    return requestJson(API_PATHS.modelInstall, { method: "POST" }, (data) => modelInstallStatusSchema.parse(data));
  },
  async clearModelCache(): Promise<ModelInstallStatus> {
    return requestJson(API_PATHS.modelCache, { method: "DELETE" }, (data) => modelInstallStatusSchema.parse(data));
  },
  async getAudios(year: number, month: number): Promise<AudioListResponse> {
    return requestJson(
      `${API_PATHS.audios}?year=${year}&month=${month}`,
      { method: "GET" },
      (data) => normalizeAudioListResponse(audioListResponseSchema.parse(data))
    );
  },
  async getAudio(audioId: string): Promise<AudioRecord> {
    return requestJson(`${API_PATHS.audios}/${audioId}`, { method: "GET" }, (data) =>
      normalizeAudioRecord(audioRecordSchema.parse(data))
    );
  },
  async importAudio(payload: ImportAudioRequest): Promise<AudioRecord> {
    return requestJson(
      `${API_PATHS.audios}/import`,
      { method: "POST", body: JSON.stringify(payload) },
      (data) => normalizeAudioRecord(audioRecordSchema.parse(data))
    );
  },
  async downloadAudio(audioId: string): Promise<DownloadAudioResponse> {
    return requestJson(`${API_PATHS.audios}/${audioId}/download`, { method: "GET" }, (data) =>
      normalizeDownloadAudioResponse(downloadAudioResponseSchema.parse(data))
    );
  },
  async deleteAudio(audioId: string): Promise<void> {
    const response = await fetch(resolveApiPath(`${API_PATHS.audios}/${audioId}`), { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
  },
  async getPractice(audioId: string): Promise<PracticePayload> {
    return requestJson(`${API_PATHS.practice}/${audioId}`, { method: "GET" }, (data) =>
      normalizePracticePayload(practicePayloadSchema.parse(data))
    );
  },
  async createBlanks(audioId: string, payload: CreateBlankExerciseRequest = {}): Promise<BlankExercise> {
    return requestJson(
      `${API_PATHS.practice}/${audioId}/blanks`,
      { method: "POST", body: JSON.stringify(payload) },
      (data) => blankExerciseSchema.parse(data)
    );
  },
  async checkPractice(audioId: string, payload: CheckPracticeRequest): Promise<PracticeCheckResult> {
    return requestJson(
      `${API_PATHS.practice}/${audioId}/check`,
      { method: "POST", body: JSON.stringify(payload) },
      (data) => practiceCheckResultSchema.parse(data)
    );
  }
};

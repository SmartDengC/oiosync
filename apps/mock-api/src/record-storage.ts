import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AudioRecord, GenerationTask } from "@oio/contracts";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultStorageDir = path.resolve(currentDir, "../generated-audio");
const defaultStorageFile = path.join(defaultStorageDir, "records.json");

type PersistedState = {
  audioRecords: AudioRecord[];
  generationTasks: GenerationTask[];
};

function getStorageFilePath() {
  return process.env.MOCK_API_DATA_FILE ?? defaultStorageFile;
}

export function loadPersistedState(): PersistedState {
  const filePath = getStorageFilePath();

  if (!existsSync(filePath)) {
    return {
      audioRecords: [],
      generationTasks: []
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<PersistedState>;
    return {
      audioRecords: Array.isArray(parsed.audioRecords) ? parsed.audioRecords : [],
      generationTasks: Array.isArray(parsed.generationTasks) ? parsed.generationTasks : []
    };
  } catch {
    return {
      audioRecords: [],
      generationTasks: []
    };
  }
}

export function persistState(state: PersistedState) {
  const filePath = getStorageFilePath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
}

export function clearPersistedState() {
  persistState({
    audioRecords: [],
    generationTasks: []
  });
}

export function getDefaultStorageDir() {
  return defaultStorageDir;
}

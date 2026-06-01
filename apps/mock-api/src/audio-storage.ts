import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.resolve(currentDir, "../generated-audio");

export async function ensureAudioStorage() {
  await mkdir(audioDir, { recursive: true });
}

export async function saveAudioFile(audioId: string, bytes: Uint8Array, extension = "wav") {
  await ensureAudioStorage();
  const safeExtension = extension.replace(/^\./, "");
  const fileName = `${audioId}.${safeExtension}`;
  const filePath = path.join(audioDir, fileName);
  await writeFile(filePath, bytes);
  return {
    fileName,
    filePath,
    publicUrl: `/generated-audio/${fileName}`
  };
}

export function getAudioStorageDir() {
  return audioDir;
}

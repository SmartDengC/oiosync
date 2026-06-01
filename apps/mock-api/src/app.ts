import cors from "cors";
import express from "express";
import path from "node:path";
import { extname } from "node:path";

import {
  API_PATHS,
  checkPracticeRequestSchema,
  createBlankExerciseRequestSchema,
  createGenerationRequestSchema,
  downloadAudioResponseSchema,
  importAudioRequestSchema,
  practiceCheckResultSchema
} from "@oio/contracts";

import { ensureAudioStorage, getAudioStorageDir, saveAudioFile } from "./audio-storage";
import {
  audioRecords,
  completeGenerationTask,
  createExercise,
  createPendingGeneration,
  failGenerationTask,
  getAudio,
  getGenerationTask,
  getPractice,
  importAudio,
  installModel,
  modelStatus,
  nextAudioId,
  removeAudio,
  resetModelCache,
  updateGenerationProgress,
  voices
} from "./data";
import { splitTextIntoSentences, createSentenceSegments } from "./sentence-segmentation";
import { synthesizeSpeechSegments } from "./tts";
import { concatWavFiles } from "./wav";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/generated-audio", express.static(path.resolve(getAudioStorageDir())));

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.get(API_PATHS.voices, (_request, response) => {
    response.json(voices);
  });

  async function processGenerationTask(taskId: string, payload: { text: string; voiceId: string }, audioId: string, sentenceTexts: string[]) {
    try {
      const audioSegments = await synthesizeSpeechSegments(sentenceTexts, payload.voiceId, (completedSentences) => {
        updateGenerationProgress(taskId, completedSentences);
      });

      if (!audioSegments) {
        failGenerationTask(taskId, "未生成真实音频，请检查 TTS 配置或重试");
        return;
      }

      const combinedAudio = concatWavFiles(audioSegments);
      await ensureAudioStorage();
      const saved = await saveAudioFile(audioId, combinedAudio.audioBytes, "wav");
      const sentenceSegments = createSentenceSegments(sentenceTexts, combinedAudio.durationsMs);

      completeGenerationTask(taskId, {
        audioUrl: saved.publicUrl,
        sentences: sentenceSegments
      });
    } catch (error) {
      failGenerationTask(taskId, error instanceof Error ? error.message : "TTS generation failed");
    }
  }

  app.post(API_PATHS.generations, async (request, response) => {
    const payload = createGenerationRequestSchema.parse(request.body);

    const createdAt = new Date().toISOString();
    const audioId = nextAudioId(new Date(createdAt));
    const sentenceTexts = splitTextIntoSentences(payload.text);
    const createdTask = createPendingGeneration(payload.text, payload.voiceId, {
        audioId,
        createdAt,
        sentences: createSentenceSegments(sentenceTexts)
      });

    response.status(202).json(createdTask);
    void processGenerationTask(createdTask.id, payload, audioId, sentenceTexts);
  });

  app.get(`${API_PATHS.generations}/:id`, (request, response) => {
    const task = getGenerationTask(request.params.id);

    if (!task) {
      response.status(404).json({ message: "Generation task not found" });
      return;
    }

    response.json(task);
  });

  app.get(API_PATHS.modelStatus, (_request, response) => {
    response.json(modelStatus);
  });

  app.post(API_PATHS.modelInstall, (_request, response) => {
    installModel();
    response.json(modelStatus);
  });

  app.delete(API_PATHS.modelCache, (_request, response) => {
    resetModelCache();
    response.json(modelStatus);
  });

  app.get(API_PATHS.audios, (request, response) => {
    const year = Number(request.query.year);
    const month = Number(request.query.month);
    const filtered = audioRecords.filter((record) => {
      if (!Number.isNaN(year) && record.year !== year) {
        return false;
      }

      if (!Number.isNaN(month) && record.month !== month) {
        return false;
      }

      return true;
    });

    response.json({
      year: Number.isNaN(year) ? new Date().getUTCFullYear() : year,
      month: Number.isNaN(month) ? new Date().getUTCMonth() + 1 : month,
      records: filtered,
      highlightedDays: [...new Set(filtered.map((record) => record.day))].sort((left, right) => left - right)
    });
  });

  app.get(`${API_PATHS.audios}/:id`, (request, response) => {
    const record = getAudio(request.params.id);

    if (!record) {
      response.status(404).json({ message: "Audio record not found" });
      return;
    }

    response.json(record);
  });

  app.post(`${API_PATHS.audios}/import`, (request, response) => {
    const payload = importAudioRequestSchema.parse(request.body);
    response.status(201).json(importAudio(payload.title, payload.sourceText));
  });

  app.get(`${API_PATHS.audios}/:id/download`, (request, response) => {
    const record = getAudio(request.params.id);

    if (!record) {
      response.status(404).json({ message: "Audio record not found" });
      return;
    }

    response.json(
      downloadAudioResponseSchema.parse({
        filename: `${record.id}${record.audioUrl ? extname(record.audioUrl) || ".wav" : ".mp3"}`,
        url: record.audioUrl ?? `/mock-downloads/${record.id}.mp3`
      })
    );
  });

  app.delete(`${API_PATHS.audios}/:id`, (request, response) => {
    if (!removeAudio(request.params.id)) {
      response.status(404).json({ message: "Audio record not found" });
      return;
    }

    response.status(204).send();
  });

  app.get(`${API_PATHS.practice}/:audioId`, (request, response) => {
    const payload = getPractice(request.params.audioId);

    if (!payload) {
      response.status(404).json({ message: "Practice payload not found" });
      return;
    }

    response.json(payload);
  });

  app.post(`${API_PATHS.practice}/:audioId/blanks`, (request, response) => {
    const payload = createBlankExerciseRequestSchema.parse(request.body ?? {});
    const exercise = createExercise(request.params.audioId, payload.preferredSentenceIds);

    if (!exercise) {
      response.status(404).json({ message: "Audio record not found" });
      return;
    }

    response.json(exercise);
  });

  app.post(`${API_PATHS.practice}/:audioId/check`, (request, response) => {
    const payload = checkPracticeRequestSchema.parse(request.body);
    const exercise = createExercise(request.params.audioId);

    if (!exercise) {
      response.status(404).json({ message: "Practice payload not found" });
      return;
    }

    const items = exercise.tokens.map((token) => {
      const received = payload.answers[token.id] ?? "";
      return {
        blankId: token.id,
        expected: token.answer,
        received,
        correct: received.trim().toLowerCase() === token.answer.trim().toLowerCase()
      };
    });

    response.json(
      practiceCheckResultSchema.parse({
        total: items.length,
        correctCount: items.filter((item) => item.correct).length,
        items
      })
    );
  });

  return app;
}

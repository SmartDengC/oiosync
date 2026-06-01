<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from "vue";
import type { SentenceSegment } from "@oio/contracts";

import PanelCard from "../../shared/ui/PanelCard.vue";
import { usePracticeStore } from "../../stores/practice";

const practiceStore = usePracticeStore();

let timer: number | undefined;

const modes = [
  { id: "subtitle", label: "字幕" },
  { id: "dictation", label: "听写" },
  { id: "create-blanks", label: "创建填空" },
  { id: "fill-blanks", label: "填空练习" }
] as const;

const playbackProgress = computed(() => {
  if (!practiceStore.totalDuration) {
    return 0;
  }

  return practiceStore.currentSeconds / practiceStore.totalDuration;
});

const fillRows = computed(() => {
  if (!practiceStore.payload || !practiceStore.blankExercise) {
    return [];
  }

  return practiceStore.payload.audio.sentences.map((sentence) => ({
    sentence,
    parts: buildFillParts(sentence)
  }));
});

function buildFillParts(sentence: SentenceSegment) {
  const tokens = (practiceStore.blankExercise?.tokens ?? []).filter((token) => token.sentenceId === sentence.id);
  const rawWords = sentence.text.split(/\s+/);
  let tokenCursor = 0;
  let wordCursor = 0;

  return rawWords.map((word, index) => {
    const cleaned = word.replace(/[^a-zA-Z']/g, "");
    const nextToken = tokens[tokenCursor];
    const shouldBlank =
      nextToken && cleaned.toLowerCase() === nextToken.answer.toLowerCase() && wordCursor === nextToken.indexInSentence;

    if (cleaned) {
      if (shouldBlank) {
        tokenCursor += 1;
      }
      wordCursor += 1;
    }

    return {
      id: `${sentence.id}-${index}`,
      token: shouldBlank ? nextToken : null,
      text: word
    };
  });
}

function stepPlayback() {
  const nextSeconds = practiceStore.currentSeconds + 0.5 * practiceStore.speed;
  const sentenceEnd = practiceStore.activeSentence ? practiceStore.activeSentence.endMs / 1000 : Infinity;
  const sentenceStart = practiceStore.activeSentence ? practiceStore.activeSentence.startMs / 1000 : 0;

  if (practiceStore.sentenceLoop && nextSeconds >= sentenceEnd) {
    practiceStore.setCurrentSeconds(sentenceStart);
    return;
  }

  if (nextSeconds >= practiceStore.totalDuration) {
    if (practiceStore.audioLoop) {
      practiceStore.setCurrentSeconds(0);
      return;
    }

    practiceStore.setCurrentSeconds(practiceStore.totalDuration);
    if (practiceStore.isPlaying) {
      practiceStore.togglePlay();
    }
    return;
  }

  practiceStore.setCurrentSeconds(nextSeconds);
}

watch(
  () => practiceStore.isPlaying,
  (isPlaying) => {
    window.clearInterval(timer);

    if (!isPlaying) {
      timer = undefined;
      return;
    }

    timer = window.setInterval(stepPlayback, 500);
  }
);

onBeforeUnmount(() => {
  window.clearInterval(timer);
});
</script>

<template>
  <PanelCard v-if="practiceStore.payload" title="练习" caption="字幕、听写、填空练习统一在同一个练习工作台中切换。">
    <div class="practice-panel">
      <div class="practice-player">
        <button class="play-button" @click="practiceStore.togglePlay()">
          {{ practiceStore.isPlaying ? "❚❚" : "▶" }}
        </button>
        <div class="practice-player__timeline">
          <span>{{ practiceStore.currentSeconds.toFixed(0) }} / {{ practiceStore.totalDuration }}</span>
          <input
            :value="practiceStore.currentSeconds"
            class="practice-slider"
            type="range"
            min="0"
            :max="practiceStore.totalDuration"
            step="0.5"
            @input="practiceStore.setCurrentSeconds(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        <select :value="practiceStore.speed" @change="practiceStore.setSpeed(Number(($event.target as HTMLSelectElement).value))">
          <option :value="0.75">0.75x</option>
          <option :value="1">1x</option>
          <option :value="1.25">1.25x</option>
        </select>
        <label class="loop-toggle">
          <span>单句循环</span>
          <input
            :checked="practiceStore.sentenceLoop"
            type="checkbox"
            @change="practiceStore.setLoops(($event.target as HTMLInputElement).checked, practiceStore.audioLoop)"
          />
        </label>
        <label class="loop-toggle">
          <span>整篇循环</span>
          <input
            :checked="practiceStore.audioLoop"
            type="checkbox"
            @change="practiceStore.setLoops(practiceStore.sentenceLoop, ($event.target as HTMLInputElement).checked)"
          />
        </label>
        <button class="button button--ghost" @click="practiceStore.previousSentence()">上一句</button>
        <button class="button button--ghost" @click="practiceStore.nextSentence()">下一句</button>
      </div>

      <div class="practice-modes">
        <span class="practice-modes__label">模式</span>
        <button
          v-for="item in modes"
          :key="item.id"
          :class="['mode-chip', { active: practiceStore.mode === item.id }]"
          data-testid="mode-button"
          @click="practiceStore.setMode(item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="practice-stage">
        <div v-if="practiceStore.mode === 'subtitle'" class="subtitle-list">
          <article
            v-for="sentence in practiceStore.payload.audio.sentences"
            :key="sentence.id"
            :class="['subtitle-line', { active: sentence.id === practiceStore.activeSentence?.id }]"
          >
            {{ sentence.text }}
          </article>
        </div>

        <div v-else-if="practiceStore.mode === 'dictation'" class="dictation-list">
          <textarea
            v-for="sentence in practiceStore.payload.audio.sentences"
            :key="sentence.id"
            class="dictation-box"
            :placeholder="`第 ${sentence.index + 1} 句听写...`"
          />
        </div>

        <div v-else-if="practiceStore.mode === 'create-blanks'" class="create-blanks-list">
          <article v-for="sentence in practiceStore.payload.audio.sentences" :key="sentence.id" class="create-blanks-line">
            <p>{{ sentence.text }}</p>
            <div class="blank-tag-list">
              <span v-for="word in sentence.focusWords" :key="word" class="blank-tag">{{ word }}</span>
            </div>
          </article>
          <button class="button button--primary" @click="practiceStore.createBlanks()">确认创建</button>
        </div>

        <div v-else class="fill-blanks-stage">
          <article v-for="row in fillRows" :key="row.sentence.id" class="fill-row">
            <template v-for="part in row.parts" :key="part.id">
              <span v-if="!part.token">{{ part.text }} </span>
              <input
                v-else
                class="blank-input"
                :placeholder="part.token.display"
                :value="practiceStore.answers[part.token.id] ?? ''"
                @input="practiceStore.updateAnswer(part.token.id, ($event.target as HTMLInputElement).value)"
              />
            </template>
          </article>
          <div class="fill-blanks-actions">
            <button class="button button--ghost" @click="practiceStore.createBlanks()">更新填空状态</button>
            <button class="button button--primary" data-testid="check-blanks" @click="practiceStore.checkAnswers()">
              检查填空
            </button>
          </div>
          <p v-if="practiceStore.result" class="fill-blanks-result">
            正确 {{ practiceStore.result.correctCount }} / {{ practiceStore.result.total }}
          </p>
        </div>
      </div>
      <div class="practice-dots">
        <span
          v-for="sentence in practiceStore.payload.audio.sentences"
          :key="sentence.id"
          :class="['practice-dots__item', { active: sentence.index <= practiceStore.currentSentenceIndex }]"
          :style="{ opacity: 0.35 + playbackProgress * 0.65 }"
        />
      </div>
    </div>
  </PanelCard>
</template>

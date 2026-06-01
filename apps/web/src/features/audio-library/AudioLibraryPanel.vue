<script setup lang="ts">
import { computed, watch } from "vue";

import PanelCard from "../../shared/ui/PanelCard.vue";
import { useAppStore } from "../../stores/app";
import { useLibraryStore } from "../../stores/library";

const emit = defineEmits<{
  openPractice: [audioId: string];
}>();

const appStore = useAppStore();
const libraryStore = useLibraryStore();

const calendarDays = computed(() => {
  const firstDay = new Date(Date.UTC(libraryStore.year, libraryStore.month - 1, 1)).getUTCDay() || 7;
  const daysInMonth = new Date(Date.UTC(libraryStore.year, libraryStore.month, 0)).getUTCDate();
  const leading = Array.from({ length: firstDay - 1 }, (_, index) => ({
    label: `leading-${index}`,
    value: null
  }));
  const actual = Array.from({ length: daysInMonth }, (_, index) => ({
    label: `${index + 1}`,
    value: index + 1
  }));
  return [...leading, ...actual];
});

watch(
  () => [libraryStore.year, libraryStore.month],
  async () => {
    await libraryStore.loadCurrentMonth();
  }
);

async function openPractice(audioId: string) {
  appStore.setCurrentAudio(audioId);
  emit("openPractice", audioId);
}

async function handleImport() {
  await libraryStore.importSample();
}

async function handleDelete(audioId: string) {
  await libraryStore.deleteRecord(audioId);
}

async function handleDownload(audioId: string) {
  const download = await libraryStore.downloadRecord(audioId);
  appStore.pushNotice(`已准备下载 ${download.filename}`);
}
</script>

<template>
  <PanelCard title="我的音频" caption="按月份查看生成记录，并快速进入练习或导出。">
    <div class="library-panel">
      <div class="library-panel__toolbar">
        <div class="library-panel__month">
          <button class="button button--ghost" data-testid="month-prev" @click="libraryStore.previousMonth()">‹</button>
          <span>{{ libraryStore.year }} 年 {{ libraryStore.month }} 月</span>
          <button class="button button--ghost" data-testid="month-next" @click="libraryStore.nextMonth()">›</button>
        </div>
        <div class="library-panel__actions">
          <button class="button button--ghost" @click="libraryStore.selectDay(null)">本月</button>
          <button class="button button--primary" @click="handleImport">导入示例</button>
        </div>
      </div>

      <div class="calendar-grid">
        <span v-for="week in ['一', '二', '三', '四', '五', '六', '日']" :key="week" class="calendar-grid__weekday">
          {{ week }}
        </span>
        <button
          v-for="day in calendarDays"
          :key="day.label"
          class="calendar-grid__cell"
          :class="{
            empty: day.value == null,
            active: day.value != null && libraryStore.selectedDay === day.value,
            highlighted: day.value != null && libraryStore.highlightedDays.includes(day.value)
          }"
          :disabled="day.value == null"
          @click="libraryStore.selectDay(day.value)"
        >
          {{ day.value ?? "" }}
        </button>
      </div>

      <div class="library-panel__records">
        <article v-for="record in libraryStore.filteredRecords" :key="record.id" class="record-card">
          <div>
            <h3>{{ record.title }}</h3>
            <p>{{ record.summary }}</p>
          </div>
          <div class="record-card__actions">
            <button class="record-link" @click="openPractice(record.id)">载入</button>
            <button class="record-link" @click="handleDownload(record.id)">下载</button>
            <button class="record-link record-link--danger" @click="handleDelete(record.id)">删除</button>
          </div>
        </article>
      </div>
    </div>
  </PanelCard>
</template>

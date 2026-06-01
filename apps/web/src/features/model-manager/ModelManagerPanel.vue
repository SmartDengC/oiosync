<script setup lang="ts">
import PanelCard from "../../shared/ui/PanelCard.vue";
import { useModelStore } from "../../stores/model";

const modelStore = useModelStore();
</script>

<template>
  <PanelCard title="语音模型离线安装" caption="V1 先保留离线模型状态流转与浏览器缓存反馈。">
    <div v-if="modelStore.status" class="model-panel">
      <div class="model-panel__top">
        <button class="button button--primary" :disabled="modelStore.isWorking" @click="modelStore.installToBrowser()">
          安装到本浏览器
        </button>
        <button class="button button--ghost" :disabled="modelStore.isWorking" @click="modelStore.clearCache()">
          清除本地模型缓存
        </button>
        <button class="button button--ghost" disabled>仅校验（不写盘）</button>
      </div>
      <div class="model-panel__status">
        <span>当前状态：</span>
        <strong>{{ modelStore.status.message }}</strong>
      </div>
      <div class="model-panel__progress">
        <div class="model-panel__progress-fill" :style="{ width: `${modelStore.status.progress * 100}%` }" />
      </div>
      <ul class="model-panel__steps">
        <li v-for="step in modelStore.status.steps" :key="step.id" :class="{ done: step.done }">{{ step.label }}</li>
      </ul>
    </div>
  </PanelCard>
</template>

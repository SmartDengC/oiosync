<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { DEMO_PASSWORD, DEMO_USERNAME, useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const username = ref("");
const password = ref("");
const validationMessage = ref("");

const displayError = computed(() => validationMessage.value || authStore.errorMessage);

function resolveRedirectTarget(rawRedirect: unknown) {
  if (typeof rawRedirect !== "string") {
    return "/";
  }

  if (!rawRedirect.startsWith("/") || rawRedirect.startsWith("//") || rawRedirect.startsWith("/login")) {
    return "/";
  }

  return rawRedirect;
}

async function handleSubmit() {
  authStore.errorMessage = "";

  if (!username.value.trim()) {
    validationMessage.value = "请输入用户名";
    return;
  }

  if (!password.value) {
    validationMessage.value = "请输入密码";
    return;
  }

  validationMessage.value = "";

  const isSuccess = authStore.login(username.value.trim(), password.value);
  if (!isSuccess) {
    return;
  }

  await router.replace(resolveRedirectTarget(route.query.redirect));
}
</script>

<template>
  <div class="login-page">
    <section class="panel-card login-card">
      <div class="login-card__content">
        <p class="login-card__eyebrow">Access</p>
        <h1>登录 OIO Lab</h1>
        <p class="login-card__description">输入演示账号后进入主页面继续使用音频生成和练习功能。</p>

        <form class="login-form" @submit.prevent="handleSubmit">
          <label class="form-field">
            <span>用户名</span>
            <input
              v-model="username"
              class="text-input"
              type="text"
              autocomplete="username"
              placeholder="请输入用户名"
              data-testid="login-username"
            />
          </label>

          <label class="form-field">
            <span>密码</span>
            <input
              v-model="password"
              class="text-input"
              type="password"
              autocomplete="current-password"
              placeholder="请输入密码"
              data-testid="login-password"
            />
          </label>

          <p v-if="displayError" class="login-error" data-testid="login-error">{{ displayError }}</p>

          <button class="button button--primary button--block" type="submit" data-testid="login-submit">
            登录并进入主页
          </button>
        </form>

        <p class="login-hint">演示账号：{{ DEMO_USERNAME }} / {{ DEMO_PASSWORD }}</p>
      </div>
    </section>
  </div>
</template>

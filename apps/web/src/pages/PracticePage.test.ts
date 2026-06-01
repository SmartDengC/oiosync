import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replaceSpy = vi.fn();
const pushSpy = vi.fn();

vi.mock("vue-router", () => ({
  useRoute: () => ({
    params: {
      audioId: "broken-audio"
    }
  }),
  useRouter: () => ({
    replace: replaceSpy,
    push: pushSpy
  })
}));

import PracticePage from "./PracticePage.vue";
import { useAppStore } from "../stores/app";
import { usePracticeStore } from "../stores/practice";

describe("PracticePage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    replaceSpy.mockReset();
    pushSpy.mockReset();
  });

  it("redirects back home when the practice payload cannot be loaded", async () => {
    const appStore = useAppStore();
    const practiceStore = usePracticeStore();
    vi.spyOn(practiceStore, "load").mockRejectedValue(new Error("Request failed: 404"));

    mount(PracticePage);

    await Promise.resolve();
    await Promise.resolve();

    expect(appStore.notice).toBe("当前记录没有真实音频，请重新生成。");
    expect(appStore.currentAudioId).toBeNull();
    expect(replaceSpy).toHaveBeenCalledWith("/");
  });
});

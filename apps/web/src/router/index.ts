import { createMemoryHistory, createRouter, createWebHistory, type RouterHistory } from "vue-router";

import HomePage from "../pages/HomePage.vue";
import LoginPage from "../pages/LoginPage.vue";
import PracticePage from "../pages/PracticePage.vue";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginPage
  },
  {
    path: "/",
    name: "home",
    component: HomePage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/practice/:audioId",
    name: "practice",
    component: PracticePage,
    props: true,
    meta: {
      requiresAuth: true
    }
  }
];

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes
  });

  router.beforeEach((to) => {
    const authStore = useAuthStore();

    if (to.path === "/login" && authStore.isAuthenticated) {
      return "/";
    }

    if (to.meta.requiresAuth === true && !authStore.isAuthenticated) {
      return {
        path: "/login",
        query: {
          redirect: to.fullPath
        }
      };
    }
  });

  return router;
}

export function createTestRouter() {
  return createAppRouter(createMemoryHistory());
}

const router = createAppRouter();

export default router;

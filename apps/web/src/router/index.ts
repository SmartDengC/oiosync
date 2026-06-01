import { createRouter, createWebHistory } from "vue-router";

import HomePage from "../pages/HomePage.vue";
import PracticePage from "../pages/PracticePage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: HomePage
    },
    {
      path: "/practice/:audioId",
      component: PracticePage,
      props: true
    }
  ]
});

export default router;

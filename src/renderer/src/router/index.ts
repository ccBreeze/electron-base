import { createRouter, createWebHashHistory } from 'vue-router'

export const routes = [
  {
    path: '/appUpdate',
    name: 'appUpdate',
    component: () => import('@renderer/views/AppUpdate.vue'),
  },
]

export const generateRouter = () => {
  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  })

  return router
}

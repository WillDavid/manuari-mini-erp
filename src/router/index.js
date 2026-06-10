import { createRouter, createWebHistory } from 'vue-router'
import UserIdentifier from '../components/UserIdentifier.vue'

const routes = [
  { path: '/', redirect: '/pdv' },
  { path: '/identificar', component: UserIdentifier },
  {
    path: '/produtos',
    component: () => import('../views/ProdutosView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/vendas',
    component: () => import('../views/VendasView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/estoque',
    component: () => import('../views/EstoqueView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/vitrine',
    component: () => import('../views/VitrineView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pdv',
    component: () => import('../views/PdvView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const expiration = localStorage.getItem('authExpires')
  const isLogged = expiration && Date.now() < parseInt(expiration)

  if (to.meta.requiresAuth && !isLogged) {
    next('/identificar')
  } else if (to.path === '/identificar' && isLogged) {
    next('/pdv')
  } else {
    next()
  }
})

export default router

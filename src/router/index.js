import { createRouter, createWebHistory } from 'vue-router'
import ProdutosView from '../views/ProdutosView.vue'
import VendasView from '../views/VendasView.vue'
import EstoqueView from '../views/EstoqueView.vue'
import VitrineView from '../views/VitrineView.vue'
import PdvView from '../views/PdvView.vue'
import DashboardView from '../views/DashboardView.vue'
import UserIdentifier from '../components/UserIdentifier.vue'

const routes = [
  { path: '/', redirect: '/pdv' },
  { path: '/identificar', component: UserIdentifier },
  { path: '/produtos', component: ProdutosView, meta: { requiresAuth: true } },
  { path: '/vendas', component: VendasView, meta: { requiresAuth: true } },
  { path: '/estoque', component: EstoqueView, meta: { requiresAuth: true } },
  { path: '/vitrine', component: VitrineView, meta: { requiresAuth: true } },
  { path: '/pdv', component: PdvView, meta: { requiresAuth: true } },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
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

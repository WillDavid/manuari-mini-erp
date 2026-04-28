import { createRouter, createWebHistory } from 'vue-router'
import ProdutosView from '../views/ProdutosView.vue'
import VendasView from '../views/VendasView.vue'
import EstoqueView from '../views/EstoqueView.vue'
import VitrineView from '../views/VitrineView.vue'
import VitrineDetalhesView from '../views/VitrineDetalhesView.vue'
import VitrineInsightsView from '../views/VitrineInsightsView.vue'
import UserIdentifier from '../components/UserIdentifier.vue'

const routes = [
  { path: '/', redirect: '/identificar' },
  { path: '/identificar', component: UserIdentifier },
  { path: '/produtos', component: ProdutosView, meta: { requiresAuth: true } },
  { path: '/vendas', component: VendasView, meta: { requiresAuth: true } },
  { path: '/estoque', component: EstoqueView, meta: { requiresAuth: true } },
  { path: '/vitrine', component: VitrineView, meta: { requiresAuth: true } },
  { path: '/vitrine/detalhes/:id', component: VitrineDetalhesView, meta: { requiresAuth: true } },
  { path: '/vitrine/insights', component: VitrineInsightsView, meta: { requiresAuth: true } }
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
    next('/vendas')
  } else {
    next()
  }
})

export default router

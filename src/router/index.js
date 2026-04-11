import { createRouter, createWebHistory } from 'vue-router'
import ProdutosView from '../views/ProdutosView.vue'
import VendasView from '../views/VendasView.vue'
import EstoqueView from '../views/EstoqueView.vue'
import VitrineView from '../views/VitrineView.vue'
import FinanceiroView from '../views/FinanceiroView.vue'

const routes = [
  { path: '/', redirect: '/vendas' },
  { path: '/produtos', component: ProdutosView },
  { path: '/vendas', component: VendasView },
  { path: '/estoque', component: EstoqueView },
  { path: '/vitrine', component: VitrineView },
  { path: '/financeiro', component: FinanceiroView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

<template>
  <header class="navbar">
    <div class="navbar-shell">
      <router-link to="/vendas" class="logo" @click="fecharMenus">
        <img :src="logo" alt="Manuari" />
      </router-link>

      <nav :class="['nav', { open: menuAberto }]">
        <router-link to="/vendas" class="link" active-class="active" @click="fecharMenus">
          Vendas
        </router-link>

        <router-link to="/estoque" class="link" active-class="active" @click="fecharMenus">
          Estoque
        </router-link>

        <router-link to="/produtos" class="link" active-class="active" @click="fecharMenus">
          Produtos
        </router-link>

        <router-link to="/vitrine" class="link" active-class="active" @click="fecharMenus">
          Vitrine
        </router-link>

        <router-link to="/vitrine/insights" class="link" active-class="active" @click="fecharMenus">
          Insights
        </router-link>
      </nav>

      <div class="actions">
        <div v-if="itensBaixoEstoque.length" class="alert-wrapper">
          <button class="alert-btn" @click.stop="alternarAlertas">
            <span class="alert-icon">🔔</span>
            <span class="alert-count">{{ itensBaixoEstoque.length }}</span>
          </button>

          <div v-if="alertasAbertos" class="alert-dropdown">
            <div class="alert-header">
              <strong>Estoque baixo</strong>
              <span>3 ou menos pecas</span>
            </div>

            <div class="alert-list">
              <div v-for="produto in itensBaixoEstoque" :key="produto.id" class="alert-item">
                <div>
                  <strong>{{ produto.nome }}</strong>
                  <span>{{ produto.codigo || 'Sem codigo' }}</span>
                </div>
                <b>{{ produto.estoque }}</b>
              </div>
            </div>

            <router-link to="/estoque" class="alert-link" @click="fecharMenus">
              Ver estoque
            </router-link>
          </div>
        </div>

        <button class="menu-btn" @click="menuAberto = !menuAberto">
          ☰
        </button>

        <button class="logout-btn" @click="logout" title="Sair">
          ⏻
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import logo from '../assets/manuari-logotipo-300dpi.png'
import { supabase } from '../services/supabase'

export default {
  data() {
    return {
      menuAberto: false,
      alertasAbertos: false,
      itensBaixoEstoque: [],
      logo
    }
  },

  mounted() {
    this.buscarAlertasEstoque()
    window.addEventListener('estoque-atualizado', this.buscarAlertasEstoque)
    document.addEventListener('click', this.fecharDropdownExterno)
  },

  beforeUnmount() {
    window.removeEventListener('estoque-atualizado', this.buscarAlertasEstoque)
    document.removeEventListener('click', this.fecharDropdownExterno)
  },

  watch: {
    '$route.fullPath'() {
      this.fecharMenus()
      this.buscarAlertasEstoque()
    }
  },

  methods: {
    async buscarAlertasEstoque() {
      const { data, error } = await supabase
        .from('produtos_erp')
        .select('id, nome, codigo, estoque, ativo')
        .eq('ativo', true)
        .order('estoque', { ascending: true })

      if (error) return

      this.itensBaixoEstoque = (data || []).filter(
        (produto) => Number(produto.estoque || 0) <= 3,
      )
    },

    alternarAlertas() {
      this.alertasAbertos = !this.alertasAbertos
      this.menuAberto = false
    },

    fecharMenus() {
      this.menuAberto = false
      this.alertasAbertos = false
    },

    logout() {
      localStorage.removeItem('authExpires')
      this.$router.push('/identificar')
    },

    fecharDropdownExterno(event) {
      if (!this.$el.contains(event.target)) {
        this.fecharMenus()
      }
    }
  }
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 30;
  min-height: 76px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
  padding: 0 20px;
}

.navbar-shell {
  width: 100%;
  max-width: 1520px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 76px;
}

.logo {
  display: inline-flex;
  align-items: center;
}

.logo img {
  height: 34px;
  object-fit: contain;
}

.nav {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

.link {
  text-decoration: none;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 14px;
  border-radius: 999px;
  transition: 0.2s;
}

.link:hover {
  background: var(--surface-muted);
  color: var(--text);
}

.active {
  background: var(--primary-soft);
  color: var(--primary-hover);
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 0;
}

.logo {
  margin-right: auto;
}

.nav,
.actions {
  flex-shrink: 0;
}

.alert-wrapper {
  position: relative;
}

.alert-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid #fed7aa;
  background: var(--primary-soft);
  cursor: pointer;
}

.alert-icon {
  font-size: 18px;
}

.alert-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--danger);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.alert-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: min(360px, calc(100vw - 32px));
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
  padding: 14px;
}

.alert-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.alert-header strong {
  font-size: 14px;
}

.alert-header span {
  color: var(--text-muted);
  font-size: 12px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px 0;
}

.alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.alert-item div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-item strong {
  font-size: 13px;
}

.alert-item span {
  color: var(--text-muted);
  font-size: 12px;
}

.alert-item b {
  min-width: 28px;
  text-align: right;
  color: var(--danger);
}

.alert-link {
  display: inline-flex;
  justify-content: center;
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  text-decoration: none;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  font-weight: 600;
}

.menu-btn {
  display: none;
  width: 42px;
  height: 42px;
  font-size: 20px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  color: var(--text);
}

.logout-btn {
  width: 42px;
  height: 42px;
  font-size: 18px;
  background: var(--danger-soft);
  border: 1px solid #fecaca;
  border-radius: 12px;
  cursor: pointer;
  color: var(--danger);
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 12px;
  }

  .navbar-shell {
    min-height: 68px;
    gap: 12px;
  }

  .menu-btn {
    display: block;
  }

  .nav {
    position: absolute;
    top: calc(100% + 8px);
    right: 12px;
    background: rgba(255, 255, 255, 0.98);
    flex-direction: column;
    width: min(220px, calc(100vw - 32px));
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: var(--shadow-md);
    padding: 10px;
    display: none;
    margin: 0;
  }

  .nav.open {
    display: flex;
  }

  .link {
    padding: 10px;
  }

  .logo img {
    height: 30px;
  }

  .alert-dropdown {
    right: -52px;
    width: min(320px, calc(100vw - 24px));
  }
}
</style>

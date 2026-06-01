<template>
  <header class="navbar">
    <div class="navbar-shell">
      <router-link to="/vendas" class="logo" @click="fecharMenus">
        <img :src="logo" alt="Manuari" />
        <span class="version">v{{ versao }}</span>
      </router-link>

      <nav :class="['nav', { open: menuAberto }]">
        <router-link to="/pdv" class="link" active-class="active" @click="fecharMenus">
          PDV
        </router-link>

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
      </nav>

      <div class="actions">
        <div v-if="itensBaixoEstoque.length" class="alert-wrapper">
          <button class="alert-btn" @click.stop="alternarAlertas" :class="{ active: alertasAbertos }">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="itensBaixoEstoque.length" class="alert-count">{{ itensBaixoEstoque.length }}</span>
          </button>

          <div v-if="alertasAbertos" class="alert-dropdown">
            <div class="alert-header">
              <span class="alert-title">Estoque baixo</span>
              <span class="alert-sub">3 ou menos peças</span>
            </div>

            <div class="alert-list">
              <div v-for="produto in itensBaixoEstoque" :key="produto.id" class="alert-item">
                <div class="alert-item-name">{{ produto.nome }}</div>
                <div class="alert-item-code">{{ produto.codigo || '—' }}</div>
                <b class="alert-item-qty">{{ produto.estoque }}</b>
              </div>
            </div>

            <router-link to="/estoque" class="alert-link" @click="fecharMenus">
              Ver estoque
            </router-link>
          </div>
        </div>

        <button class="menu-btn" @click="menuAberto = !menuAberto">
          <svg v-if="!menuAberto" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <button class="logout-btn" @click="logout" title="Sair">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import logo from '../assets/manuari-logotipo-300dpi.png'
import { supabase } from '../services/supabase'
import pkg from '../../package.json'

export default {
  data() {
    return {
      menuAberto: false,
      alertasAbertos: false,
      itensBaixoEstoque: [],
      logo,
      versao: pkg.version
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
  height: 52px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 var(--border);
  padding: 0 20px;
}

.navbar-shell {
  width: 100%;
  max-width: 1520px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
  height: 100%;
}

.logo {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.logo img {
  height: 28px;
  object-fit: contain;
}

.version {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-dim);
  margin-left: 8px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.nav {
  display: flex;
  gap: 2px;
  align-items: center;
  height: 100%;
}

.link {
  text-decoration: none;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  padding: 0 12px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.link:hover {
  color: var(--text);
}

.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s;
}

.alert-btn:hover,
.alert-btn.active {
  border-color: var(--warning);
  color: var(--warning);
  background: var(--warning-soft);
}

.alert-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--danger);
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-feature-settings: 'tnum' 1;
}

.alert-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.alert-header {
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.alert-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.alert-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.alert-list {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px 0;
}

.alert-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 8px 14px;
  transition: background 0.1s;
}

.alert-item:hover {
  background: var(--surface-soft);
}

.alert-item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.alert-item-code {
  font-size: 11px;
  color: var(--text-muted);
}

.alert-item-qty {
  font-size: 12px;
  color: var(--danger);
  font-weight: 700;
  font-feature-settings: 'tnum' 1;
  min-width: 20px;
  text-align: right;
}

.alert-link {
  display: block;
  text-align: center;
  padding: 10px;
  text-decoration: none;
  background: var(--primary);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-top: 1px solid var(--border);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  transition: background 0.15s;
}

.alert-link:hover {
  background: var(--primary-hover);
}

.menu-btn {
  display: none;
  width: 44px;
  height: 44px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.menu-btn svg {
  pointer-events: none;
}

.menu-btn:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.menu-btn:active {
  background: var(--surface-muted);
  transform: scale(0.95);
}

.logout-btn {
  width: 44px;
  height: 44px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.logout-btn svg,
.alert-btn svg {
  pointer-events: none;
}

.logout-btn:hover {
  background: var(--danger-soft);
  border-color: var(--danger);
  color: var(--danger);
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 12px;
  }

  .menu-btn {
    display: flex;
    z-index: 35;
  }

  .nav {
    position: absolute;
    top: calc(100% + 4px);
    right: 12px;
    background: var(--surface);
    flex-direction: column;
    width: 220px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: 0 8px 32px rgba(15, 23, 42, 0.18);
    padding: 8px;
    display: none;
    height: auto;
    gap: 4px;
    margin: 0;
    z-index: 34;
  }

  .nav.open {
    display: flex;
  }

  .link {
    width: 100%;
    height: 44px;
    padding: 0 12px;
    border-bottom: none;
    border-radius: var(--radius-sm);
    font-size: 14px;
  }

  .link.active {
    background: var(--primary-soft);
    color: var(--primary);
  }

  .nav .link:active {
    background: var(--surface-muted);
  }

  .logo img {
    height: 24px;
  }

  .alert-dropdown {
    right: -16px;
    width: calc(100vw - 32px);
    max-width: 340px;
  }
}
</style>
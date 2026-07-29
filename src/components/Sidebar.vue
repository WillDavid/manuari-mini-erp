<template>
  <!-- Mobile top bar -->
  <header class="mobile-bar">
    <button class="mobile-menu-btn" aria-label="Abrir menu" @click="menuAberto = !menuAberto">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
    <img :src="logo" alt="Manuari" class="mobile-logo" />
    <span class="mobile-version">v{{ versao }}</span>
  </header>

  <!-- Overlay para mobile -->
  <Transition name="fade">
    <div v-if="menuAberto" class="sidebar-overlay" @click="menuAberto = false" />
  </Transition>

  <!-- Sidebar -->
  <aside
    :class="[
      'sidebar',
      { collapsed: colapsado, 'mobile-open': menuAberto }
    ]"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Topo: Logo + Toggle -->
    <div class="sidebar-top">
      <div class="sidebar-brand" @click="$router.push('/vendas')">
        <img :src="logo" alt="Manuari" class="sidebar-logo" />
        <div v-show="!colapsado" class="sidebar-brand-info">
          <span class="sidebar-brand-name">Manuari</span>
          <span class="sidebar-version">v{{ versao }}</span>
        </div>
      </div>
      <button class="toggle-btn" :title="colapsado ? 'Expandir menu' : 'Recolher menu'" @click="alternarColapso">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline v-if="colapsado" points="9 18 15 12 9 6" />
          <polyline v-else points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>

    <!-- Itens de navegacao -->
    <nav class="sidebar-nav">
      <router-link
        v-for="item in itensNavegacao"
        :key="item.rota"
        :to="item.rota"
        :title="colapsado ? item.nome : ''"
        class="nav-item"
        :class="{ active: isActive(item.rota) }"
        @click="fecharMobile"
      >
        <span class="nav-icon" v-html="item.icone" />
        <span v-show="!colapsado" class="nav-label">{{ item.nome }}</span>
        <span
          v-if="colapsado"
          class="nav-tooltip"
        >{{ item.nome }}</span>
      </router-link>
    </nav>

    <!-- Espacador -->
    <div class="sidebar-spacer" />

    <!-- Bottom: Sair -->
    <div class="sidebar-bottom">
      <button
        class="bottom-item logout-item"
        :title="colapsado ? 'Sair' : ''"
        @click="logout"
      >
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </span>
        <span v-show="!colapsado" class="nav-label">Sair</span>
        <span v-if="colapsado" class="nav-tooltip">Sair</span>
      </button>
    </div>
  </aside>
</template>

<script>
import logo from '../assets/manuari-logotipo-300dpi.png'
import pkg from '../../package.json'

const STORAGE_KEY = 'sidebar_collapsed'

export default {
  name: 'Sidebar',

  data() {
    return {
      logo,
      versao: pkg.version,
      colapsado: this.lerEstadoSalvo(),
      menuAberto: false,
      itensNavegacao: [
        {
          nome: 'PDV',
          rota: '/pdv',
          icone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
        },
        {
          nome: 'Dashboard',
          rota: '/dashboard',
          icone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="13" width="7" height="8" rx="1"/></svg>',
        },
        {
          nome: 'Vendas',
          rota: '/vendas',
          icone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
        },
        {
          nome: 'Estoque',
          rota: '/estoque',
          icone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        },
        {
          nome: 'Produtos',
          rota: '/produtos',
          icone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
        },
        {
          nome: 'Vitrine',
          rota: '/vitrine',
          icone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        },
        {
          nome: 'Caixa',
          rota: '/fluxo-caixa',
          icone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        },
      ],
    }
  },

  watch: {
    '$route.fullPath'() {
      this.fecharMenus()
    },
    colapsado() {
      this.salvarEstado()
      this.aplicarLargura()
    },
  },

  mounted() {
    this.aplicarLargura()
    document.addEventListener('keydown', this.onKeydown)
    document.addEventListener('click', this.fecharDropdownExterno)
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
    document.removeEventListener('click', this.fecharDropdownExterno)
  },

  methods: {
    lerEstadoSalvo() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'true') return true
      if (saved === 'false') return false
      return false
    },

    salvarEstado() {
      localStorage.setItem(STORAGE_KEY, String(this.colapsado))
    },

    alternarColapso() {
      this.colapsado = !this.colapsado
    },

    aplicarLargura() {
      const largura = this.colapsado ? 64 : 240
      document.documentElement.style.setProperty('--sidebar-width', largura + 'px')
    },

    isActive(rota) {
      return this.$route.path === rota
    },

    fecharMobile() {
      this.menuAberto = false
    },

    fecharMenus() {
      this.menuAberto = false
    },

    logout() {
      localStorage.removeItem('authExpires')
      this.$router.push('/identificar')
    },

    fecharDropdownExterno(event) {
      const sidebar = this.$el
      if (!sidebar.contains(event.target)) {
        this.menuAberto = false
      }
    },

    onKeydown(e) {
      if (e.key === 'Escape') {
        this.fecharMenus()
      }
    },

    onMouseEnter() {
      if (this.colapsado) {
        this._hoverExpand = true
      }
    },

    onMouseLeave() {
      if (this.colapsado) {
        this._hoverExpand = false
      }
    },
  },
}
</script>

<style scoped>
/* ===== MOBILE BAR ===== */
.mobile-bar {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  z-index: 50;
  align-items: center;
  padding: 0 12px;
  gap: 10px;
}

.mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
}

.mobile-logo {
  height: 24px;
  object-fit: contain;
}

.mobile-version {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-dim);
  margin-left: auto;
}

/* ===== OVERLAY ===== */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 54;
}

/* ===== SIDEBAR ===== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 240px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 55;
  transition: width 0.25s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

/* Topo */
.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  height: 56px;
  flex-shrink: 0;
  gap: 8px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
  flex: 1;
  overflow: hidden;
}

.sidebar-logo {
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

.sidebar-brand-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  overflow: hidden;
}

.sidebar-brand-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}

.sidebar-version {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-dim);
  white-space: nowrap;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.toggle-btn:hover {
  background: var(--surface-muted);
  color: var(--text);
  border-color: var(--border-strong);
}

/* Navegacao */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  flex: 1;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Tooltip no modo colapsado */
.nav-tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--text);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 60;
  box-shadow: var(--shadow-md);
}

.nav-item:hover .nav-tooltip {
  opacity: 1;
}

/* Espacador */
.sidebar-spacer {
  flex: 1;
  min-height: 8px;
}

/* Bottom */
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.bottom-item-wrapper {
  position: relative;
}

.bottom-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  width: 100%;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}

.bottom-item:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.logout-item:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

/* ===== TRANSITIONS ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== RESPONSIVO ===== */
@media (max-width: 768px) {
  .mobile-bar {
    display: flex;
  }

  .sidebar {
    transform: translateX(-100%);
    box-shadow: none;
    z-index: 55;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
    box-shadow: 8px 0 32px rgba(15, 23, 42, 0.25);
  }

  .sidebar-overlay {
    display: block;
  }

  .sidebar.collapsed {
    width: 240px;
  }
}
</style>

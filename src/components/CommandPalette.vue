<template>
  <div v-if="aberto" class="palette-overlay" @click.self="fechar">
    <div class="palette" role="dialog" aria-modal="true" aria-label="Comando rápido">
      <div class="palette-input-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref="searchInput"
          v-model="busca"
          type="text"
          placeholder="Digite um comando..."
          @keydown="navegar"
          class="palette-input"
        />
        <kbd class="palette-kbd">esc</kbd>
      </div>

      <div class="palette-results" v-if="resultados.length">
        <div v-for="(grupo, gIdx) in resultados" :key="gIdx" class="palette-group">
          <div class="palette-group-label">{{ grupo.label }}</div>
          <div
            v-for="(item, iIdx) in grupo.itens"
            :key="item.id"
            :ref="el => itemRefs[item.id] = el"
            class="palette-item"
            :class="{ selected: selecionadoId === item.id }"
            @click="executar(item)"
            @mouseenter="selecionadoId = item.id"
          >
            <span class="palette-item-icon" v-html="item.icone"></span>
            <div class="palette-item-content">
              <span class="palette-item-label">{{ item.label }}</span>
              <span v-if="item.descricao" class="palette-item-desc">{{ item.descricao }}</span>
            </div>
            <kbd v-if="item.atalho" class="palette-item-kbd">{{ item.atalho }}</kbd>
          </div>
        </div>
      </div>

      <div v-else class="palette-empty">Nenhum resultado</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommandPalette',

  data() {
    return {
      aberto: false,
      busca: '',
      selecionadoId: null,
      itemRefs: {},
    }
  },

  computed: {
    todosComandos() {
      return [
        {
          label: 'Navegação',
          itens: [
            { id: 'nav-dashboard', label: 'Dashboard', descricao: 'Visão geral do negócio', icone: '📊', acao: () => this.$router.push('/dashboard') },
            { id: 'nav-pdv', label: 'PDV', descricao: 'Ponto de venda', icone: '🛒', acao: () => this.$router.push('/pdv'), atalho: 'Alt+1' },
            { id: 'nav-vendas', label: 'Vendas', descricao: 'Histórico e gestão', icone: '💰', acao: () => this.$router.push('/vendas') },
            { id: 'nav-estoque', label: 'Estoque', descricao: 'Controle de inventário', icone: '📦', acao: () => this.$router.push('/estoque') },
            { id: 'nav-produtos', label: 'Produtos', descricao: 'Catálogo e preços', icone: '🏷️', acao: () => this.$router.push('/produtos') },
            { id: 'nav-vitrine', label: 'Vitrine', descricao: 'Produtos personalizados', icone: '🖼️', acao: () => this.$router.push('/vitrine') },
          ],
        },
        {
          label: 'Ações Rápidas',
          itens: [
            { id: 'acao-sair', label: 'Sair do sistema', descricao: 'Fazer logout', icone: '🚪', acao: () => this.logout(), atalho: 'Alt+Q' },
          ],
        },
      ]
    },

    resultados() {
      if (!this.busca.trim()) return this.todosComandos
      const termo = this.busca.toLowerCase()
      return this.todosComandos
        .map(grupo => ({
          ...grupo,
          itens: grupo.itens.filter(
            item =>
              item.label.toLowerCase().includes(termo) ||
              (item.descricao && item.descricao.toLowerCase().includes(termo)),
          ),
        }))
        .filter(grupo => grupo.itens.length)
    },

    todosItens() {
      return this.resultados.flatMap(g => g.itens)
    },
  },

  watch: {
    aberto(val) {
      if (val) {
        this.$nextTick(() => {
          this.busca = ''
          this.selecionadoId = null
          this.$refs.searchInput?.focus()
        })
      }
    },
  },

  mounted() {
    this._onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        this.aberto = !this.aberto
      }
      if (e.key === 'Escape' && this.aberto) {
        this.fechar()
      }
      if (e.altKey && e.key === '1') { e.preventDefault(); this.$router.push('/pdv') }
      if (e.altKey && e.key === 'q') { e.preventDefault(); this.logout() }
    }
    document.addEventListener('keydown', this._onKey)
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this._onKey)
  },

  methods: {
    fechar() {
      this.aberto = false
    },

    executar(item) {
      this.fechar()
      this.$nextTick(() => item.acao())
    },

    navegar(e) {
      const itens = this.todosItens
      if (!itens.length) return

      let idx = itens.findIndex(i => i.id === this.selecionadoId)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        idx = idx < itens.length - 1 ? idx + 1 : 0
        this.selecionadoId = itens[idx].id
        this.scrollToItem(itens[idx].id)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        idx = idx > 0 ? idx - 1 : itens.length - 1
        this.selecionadoId = itens[idx].id
        this.scrollToItem(itens[idx].id)
      } else if (e.key === 'Enter' && this.selecionadoId) {
        e.preventDefault()
        const item = itens.find(i => i.id === this.selecionadoId)
        if (item) this.executar(item)
      }
    },

    scrollToItem(id) {
      this.$nextTick(() => {
        this.itemRefs[id]?.[0]?.scrollIntoView({ block: 'nearest' })
      })
    },

    logout() {
      localStorage.removeItem('authExpires')
      this.$router.push('/identificar')
    },
  },
}
</script>

<style scoped>
.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}

.palette {
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 560px;
  overflow: hidden;
  animation: slideUp 150ms ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.palette-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--sp-03);
  padding: var(--sp-04) var(--sp-05);
  border-bottom: 1px solid var(--border);
}

.palette-input {
  flex: 1;
  border: none;
  outline: none;
  height: 36px;
  font-size: var(--fs-body);
  background: transparent;
  color: var(--text);
  padding: 0;
}

.palette-input::placeholder {
  color: var(--text-placeholder);
}

.palette-kbd {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 6px;
  border-radius: 4px;
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.5px;
}

.palette-results {
  max-height: 320px;
  overflow-y: auto;
  padding: var(--sp-02) 0;
}

.palette-group-label {
  padding: var(--sp-03) var(--sp-05);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: var(--sp-03);
  padding: var(--sp-03) var(--sp-05);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.palette-item.selected {
  background: var(--layer-hover);
}

.palette-item-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.palette-item-content {
  flex: 1;
  min-width: 0;
}

.palette-item-label {
  display: block;
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--text);
}

.palette-item-desc {
  display: block;
  font-size: var(--fs-label);
  color: var(--text-secondary);
  margin-top: 1px;
}

.palette-item-kbd {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 5px;
  border-radius: 3px;
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  flex-shrink: 0;
}

.palette-empty {
  padding: var(--sp-07) var(--sp-05);
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--fs-body);
}
</style>

<template>
  <div class="global-search" ref="searchRoot">
    <div class="search-input-wrap">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        ref="inputRef"
        v-model="termo"
        type="text"
        placeholder="Buscar produtos, clientes..."
        @focus="aberto = true"
        @keydown="navegar"
        class="search-input"
      />
      <button v-if="termo" class="search-clear" @click="termo = ''" aria-label="Limpar busca">✕</button>
    </div>

    <Transition name="search-drop">
      <div v-if="aberto && (carregando || resultados.length || termo.length >= 2)" class="search-dropdown" @click.stop>
        <div v-if="carregando" class="search-loading">Buscando...</div>

        <template v-else>
          <div v-if="!resultados.length && termo.length >= 2" class="search-empty">Nenhum resultado para "{{ termo }}"</div>

          <div v-for="(grupo, gIdx) in grupos" :key="gIdx">
            <div v-if="grupo.itens.length" class="search-group-label">{{ grupo.label }}</div>
            <div
              v-for="item in grupo.itens"
              :key="item.id"
              class="search-item"
              :class="{ selected: selecionado === item.id }"
              @click="selecionar(item)"
              @mouseenter="selecionado = item.id"
            >
              <span class="search-item-icon">{{ grupo.icone }}</span>
              <div class="search-item-info">
                <span class="search-item-name">{{ item.nome }}</span>
                <span class="search-item-detail">{{ item.detalhe }}</span>
              </div>
              <span class="search-item-action">→</span>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script>
import { supabase } from '../services/supabase'

export default {
  name: 'GlobalSearch',

  data() {
    return {
      termo: '',
      aberto: false,
      carregando: false,
      resultados: [],
      selecionado: null,
      timer: null,
    }
  },

  computed: {
    grupos() {
      const produtos = this.resultados
        .filter(r => r.tipo === 'produto')
        .map(r => ({
          ...r,
          detalhe: r.preco ? `R$ ${Number(r.preco).toFixed(2).replace('.', ',')} — Estoque: ${r.estoque || 0}` : '',
        }))

      const clientes = this.resultados
        .filter(r => r.tipo === 'cliente')
        .map(r => ({
          ...r,
          detalhe: r.pedidos ? `${r.pedidos} pedido${r.pedidos > 1 ? 's' : ''}` : '',
        }))

      return [
        { label: 'Produtos', icone: '📦', itens: produtos.slice(0, 5) },
        { label: 'Clientes', icone: '👤', itens: clientes.slice(0, 5) },
      ]
    },
  },

  watch: {
    termo() {
      this.selecionado = null
      clearTimeout(this.timer)
      if (!this.termo || this.termo.length < 2) {
        this.resultados = []
        return
      }
      this.timer = setTimeout(() => this.buscar(), 200)
    },
  },

  mounted() {
    document.addEventListener('click', this.fecharFora)
  },

  beforeUnmount() {
    document.removeEventListener('click', this.fecharFora)
  },

  methods: {
    async buscar() {
      this.carregando = true
      const termo = `%${this.termo}%`

      try {
        const [prodRes, vendRes] = await Promise.all([
          supabase
            .from('produtos_erp')
            .select('id, nome, codigo, preco_venda, estoque')
            .eq('ativo', true)
            .or(`nome.ilike.${termo},codigo.ilike.${termo}`)
            .limit(5),

          supabase
            .from('vendas_erp')
            .select('cliente')
            .ilike('cliente', termo)
            .limit(20),
        ])

        const resultados = []

        ;(prodRes.data || []).forEach(p => {
          resultados.push({ id: `p-${p.id}`, tipo: 'produto', nome: p.nome, preco: p.preco_venda, estoque: p.estoque, acao: p })
        })

        const clienteMap = {}
        ;(vendRes.data || []).forEach(v => {
          if (!v.cliente) return
          const key = v.cliente.toLowerCase().trim()
          clienteMap[key] = (clienteMap[key] || 0) + 1
        })

        Object.entries(clienteMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([nome, pedidos]) => {
            resultados.push({ id: `c-${nome}`, tipo: 'cliente', nome, pedidos, acao: null })
          })

        this.resultados = resultados
      } catch (e) {
        console.error(e)
      } finally {
        this.carregando = false
      }
    },

    selecionar(item) {
      this.aberto = false
      this.termo = ''
      if (item.tipo === 'produto') {
        this.$router.push('/produtos')
      } else if (item.tipo === 'cliente') {
        this.$router.push('/vendas')
      }
    },

    navegar(e) {
      const todos = this.grupos.flatMap(g => g.itens)
      if (!todos.length) return

      let idx = todos.findIndex(i => i.id === this.selecionado)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        idx = idx < todos.length - 1 ? idx + 1 : 0
        this.selecionado = todos[idx].id
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        idx = idx > 0 ? idx - 1 : todos.length - 1
        this.selecionado = todos[idx].id
      } else if (e.key === 'Enter' && this.selecionado) {
        e.preventDefault()
        const item = todos.find(i => i.id === this.selecionado)
        if (item) this.selecionar(item)
      } else if (e.key === 'Escape') {
        this.aberto = false
      }
    },

    fecharFora(e) {
      if (!this.$refs.searchRoot?.contains(e.target)) {
        this.aberto = false
      }
    },
  },
}
</script>

<style scoped>
.global-search {
  position: relative;
  flex: 1;
  max-width: 360px;
  margin: 0 var(--sp-05);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--sp-02);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  padding: 0 var(--sp-03);
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.search-input-wrap:focus-within {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.search-input-wrap svg {
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 32px;
  border: none;
  outline: none;
  background: transparent;
  color: white;
  font-size: var(--fs-body);
  padding: 0;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  flex-shrink: 0;
  padding: 0;
}

.search-clear:hover {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + var(--sp-03));
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-height: 360px;
  overflow-y: auto;
  z-index: 100;
}

.search-loading,
.search-empty {
  padding: var(--sp-06) var(--sp-05);
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--fs-body);
}

.search-group-label {
  padding: var(--sp-03) var(--sp-05) var(--sp-02);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: var(--sp-03);
  padding: var(--sp-03) var(--sp-05);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.search-item.selected,
.search-item:hover {
  background: var(--layer-hover);
}

.search-item-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.search-item-info {
  flex: 1;
  min-width: 0;
}

.search-item-name {
  display: block;
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-item-detail {
  display: block;
  font-size: var(--fs-label);
  color: var(--text-secondary);
  margin-top: 1px;
}

.search-item-action {
  color: var(--text-secondary);
  font-size: 14px;
  flex-shrink: 0;
}

.search-drop-enter-active {
  transition: opacity 120ms ease-out, transform 120ms ease-out;
}
.search-drop-leave-active {
  transition: opacity 80ms ease-in, transform 80ms ease-in;
}
.search-drop-enter-from,
.search-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

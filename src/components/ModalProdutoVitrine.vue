<template>
  <div class="modal-overlay" @click.self="!salvando && $emit('fechar')">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">{{ editando ? 'Editar Produto' : 'Novo Produto' }}</h3>
        <button class="close-btn" :disabled="salvando" aria-label="Fechar" @click="$emit('fechar')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-section">
          <label>Nome do Produto</label>
          <input v-model="local.name" placeholder="Ex: Caneca Naruto" class="input-full" />
        </div>

        <div class="form-section">
          <label>Tipo</label>
          <div class="row-inputs">
            <select v-model="local.tipo" class="flex-1">
              <option disabled value="">Selecione</option>
              <option v-for="tipo in tipos" :key="tipo" :value="tipo">{{ tipo }}</option>
            </select>
            <input
              v-model="novoTipo"
              placeholder="Novo tipo"
              class="flex-1"
              @keydown.enter.prevent="adicionarTipo"
            />
            <button class="btn ghost" type="button" @click="adicionarTipo">Adicionar</button>
          </div>
        </div>

        <div class="form-section">
          <label>Categorias</label>
          <div class="row-inputs">
            <input
              v-model="novaCategoria"
              placeholder="Nova categoria"
              class="flex-1"
              @keydown.enter.prevent="adicionarCategoria"
            />
            <button class="btn ghost" type="button" @click="adicionarCategoria">Incluir</button>
          </div>

          <div class="chips-box">
            <span
              v-for="cat in categorias"
              :key="cat"
              :class="['chip', isSelecionado(cat) ? 'chip-active' : '']"
              @click="toggleCategoria(cat)"
            >{{ cat }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="variations-header">
          <div>
            <label>Variações e Preços</label>
            <p>Cada variação tem um preço. Adicione faixas para desconto por quantidade.</p>
          </div>
          <button class="btn primary" type="button" @click="adicionarVariacao">
            + Variação
          </button>
        </div>

        <div v-if="!local.variacoes.length" class="empty-hint">
          Nenhuma variação cadastrada. Clique em "+ Variação" para começar.
        </div>

        <div v-else class="variations-list">
          <div
            v-for="(v, vi) in local.variacoes"
            :key="v._key"
            class="variation-card"
          >
            <div class="var-row">
              <div class="var-fields">
                <div class="field">
                  <label>Nome</label>
                  <input v-model="v.nome" placeholder="Ex: Branca, 33mm" />
                </div>
                <div class="field field-tipo">
                  <label>Tipo</label>
                  <select v-model="v.tipo_variacao">
                    <option v-for="tipo in tiposVariacao" :key="tipo" :value="tipo">{{ tipo }}</option>
                  </select>
                </div>
                <div class="field field-preco">
                  <label>Preço</label>
                  <input
                    v-model="v.preco"
                    type="text"
                    inputmode="decimal"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <button
                v-if="local.variacoes.length > 1"
                class="btn danger small"
                type="button"
                @click="removerVariacao(vi)"
              >Remover</button>
            </div>

            <button
              v-if="!v.mostrarFaixas"
              class="btn ghost small toggle-faixas"
              type="button"
              @click="v.mostrarFaixas = true"
            >
              + Faixas de preço por quantidade
            </button>

            <div v-else class="faixas-section">
              <div class="faixas-header">
                <span class="faixas-title">Faixas de preço por quantidade</span>
                <div class="faixas-header-actions">
                  <button class="btn ghost small" type="button" @click="adicionarFaixa(v)">
                    + Faixa
                  </button>
                  <button class="btn ghost small" type="button" @click="v.mostrarFaixas = false">
                    Ocultar
                  </button>
                </div>
              </div>

              <div v-if="!v.faixas.length" class="empty-hint small">
                Nenhuma faixa. Adicione para definir preços diferentes por quantidade.
              </div>

              <div v-else class="faixas-table">
                <div class="faixas-row header-row">
                  <span class="col-qtd">Quantidade</span>
                  <span class="col-label">Rótulo</span>
                  <span class="col-preco">Preço</span>
                  <span class="col-destaque">Destaque</span>
                  <span class="col-action"></span>
                </div>
                <div
                  v-for="(f, fi) in v.faixas"
                  :key="f._key"
                  class="faixas-row"
                >
                  <input
                    v-model.number="f.quantidade_minima"
                    type="number"
                    min="1"
                    class="col-qtd"
                    placeholder="1"
                  />
                  <input
                    v-model="f.quantidade_label"
                    type="text"
                    class="col-label"
                    placeholder="Ex: 10+ un."
                  />
                  <input
                    v-model="f.preco"
                    type="text"
                    inputmode="decimal"
                    class="col-preco"
                    placeholder="0,00"
                  />
                  <label class="destaque-check">
                    <input v-model="f.destaque" type="checkbox" />
                  </label>
                  <button
                    class="btn danger small col-action"
                    type="button"
                    @click="removerFaixa(v, fi)"
                  >✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="imagens-section">
          <button
            class="imagens-toggle"
            type="button"
            @click="mostrarImagens = !mostrarImagens"
          >
            <span>{{ mostrarImagens ? '▼' : '▶' }} Imagens ({{ local.images.length }})</span>
          </button>
          <div v-if="mostrarImagens" class="imagens-body">
            <ImageManager v-model="local.images" :tipo="local.tipo" />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn ghost" :disabled="salvando" @click="$emit('fechar')">Cancelar</button>
        <button class="btn primary" :disabled="salvando" @click="salvar">
          {{ salvando ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ImageManager from './ImageManager.vue'

const TIPOS_PADRAO = [
  'canecas',
  'xicaras',
  'azulejos',
  'bottons',
  'acessorios',
]

const CATEGORIAS_PADRAO = [
  'Futebol',
  'Capivara',
  'Frases Engraçadas',
  'Anime',
  'Filmes & Series',
  'Gatos',
  'Animais',
  'Norte',
  'Estados Brasileiros',
  'Profissoes',
  'Arte',
  'Frases Motivacionais',
  'Fantasia',
  'Sao Paulo',
  'Doramas',
  'Aliens & Ufologia',
  'Desenhos',
  'Herois',
  'Mapa',
  'Plantas',
  'Musica',
  'Envie Sua Arte',
]

let keyCounter = 0
function nextKey() {
  return `k${++keyCounter}`
}

export default {
  components: { ImageManager },

  props: {
    produto: { type: Object, default: () => ({}) },
    editando: Boolean,
    salvando: Boolean,
    tiposDisponiveis: { type: Array, default: () => [] },
    categoriasDisponiveis: { type: Array, default: () => [] },
  },

  emits: ['salvar', 'fechar'],

  data() {
    return {
      local: this.buildLocal(),
      novoTipo: '',
      novaCategoria: '',
      mostrarImagens: false,
      tiposVariacao: ['cor', 'tamanho', 'modelo', 'material', 'acabamento', 'outro'],
    }
  },

  computed: {
    tipos() {
      return [...new Set([...TIPOS_PADRAO, ...this.tiposDisponiveis, this.local.tipo].filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
    },
    categorias() {
      return [...new Set([
        ...CATEGORIAS_PADRAO,
        ...this.categoriasDisponiveis,
        ...(this.local.categorias || []),
      ].filter(Boolean))].sort((a, b) => a.localeCompare(b))
    },
  },

  watch: {
    produto: {
      immediate: true,
      deep: true,
      handler() {
        this.local = this.buildLocal()
      },
    },
  },

  mounted() {
    this._escKey = (e) => { if (e.key === 'Escape') this.$emit('fechar') }
    document.addEventListener('keydown', this._escKey)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this._escKey)
  },

  methods: {
    buildLocal() {
      const variacoes = Array.isArray(this.produto?.variacoes) ? this.produto.variacoes : []

      return {
        id: this.produto?.id || null,
        name: this.produto?.name || '',
        tipo: this.produto?.tipo || '',
        categorias: Array.isArray(this.produto?.categorias) ? [...this.produto.categorias] : [],
        images: Array.isArray(this.produto?.images) ? [...this.produto.images] : [],
        variacoes: variacoes.map((v) => {
          const precos = Array.isArray(v.vitrine_precos) ? v.vitrine_precos : []
          const precoPrincipal = precos.length
            ? this.formatMoneyDisplay(precos[0].preco)
            : ''

          return {
            _key: nextKey(),
            id: v.id || null,
            nome: v.nome || '',
            tipo_variacao: v.tipo_variacao || 'cor',
            ordem: v.ordem || 0,
            preco: precoPrincipal,
            mostrarFaixas: Array.isArray(v.vitrine_precos_faixas) && v.vitrine_precos_faixas.length > 0,
            faixas: (Array.isArray(v.vitrine_precos_faixas) ? v.vitrine_precos_faixas : []).map((f) => ({
              _key: nextKey(),
              id: f.id || null,
              quantidade_minima: f.quantidade_minima ?? 1,
              quantidade_label: f.quantidade_label || '',
              preco: f.preco != null ? this.formatMoneyDisplay(f.preco) : '',
              destaque: Boolean(f.destaque),
              ordem: f.ordem || 0,
            })),
          }
        }),
      }
    },

    formatMoneyDisplay(value) {
      if (value == null || value === '') return ''
      const num = Number(value)
      if (!Number.isFinite(num)) return ''
      return num.toFixed(2).replace('.', ',')
    },

    parseMoney(value) {
      if (value == null || value === '') return 0
      return parseFloat(String(value).replace(',', '.')) || 0
    },

    toggleCategoria(cat) {
      const idx = this.local.categorias.indexOf(cat)
      if (idx >= 0) {
        this.local.categorias.splice(idx, 1)
      } else {
        this.local.categorias.push(cat)
      }
    },

    isSelecionado(cat) {
      return this.local.categorias.includes(cat)
    },

    adicionarTipo() {
      const tipo = this.novoTipo.trim()
      if (!tipo) return
      this.local.tipo = tipo
      this.novoTipo = ''
    },

    adicionarCategoria() {
      const categoria = this.novaCategoria.trim()
      if (!categoria) return
      if (!this.local.categorias.includes(categoria)) {
        this.local.categorias.push(categoria)
      }
      this.novaCategoria = ''
    },

    adicionarVariacao() {
      this.local.variacoes.push({
        _key: nextKey(),
        id: null,
        nome: '',
        tipo_variacao: 'cor',
        ordem: this.local.variacoes.length + 1,
        preco: '',
        mostrarFaixas: false,
        faixas: [],
      })
    },

    removerVariacao(index) {
      this.local.variacoes.splice(index, 1)
    },

    adicionarFaixa(variacao) {
      variacao.faixas.push({
        _key: nextKey(),
        id: null,
        quantidade_minima: 1,
        quantidade_label: '',
        preco: '',
        destaque: false,
        ordem: variacao.faixas.length + 1,
      })
    },

    removerFaixa(variacao, index) {
      variacao.faixas.splice(index, 1)
    },

    salvar() {
      const payload = {
        ...this.local,
        name: this.local.name.trim(),
        tipo: this.local.tipo.trim(),
        categorias: this.local.categorias.map((c) => c.trim()).filter(Boolean),
        variacoes: this.local.variacoes.map((v, vi) => {
          const precoValor = this.parseMoney(v.preco)

          return {
            id: v.id,
            nome: (v.nome || '').trim(),
            tipo_variacao: v.tipo_variacao || 'cor',
            ordem: vi + 1,
            vitrine_precos: precoValor > 0
              ? [{ id: null, preco: precoValor, ordem: 1 }]
              : [],
            vitrine_precos_faixas: v.faixas
              .filter((f) => f.quantidade_label?.trim() || f.preco)
              .map((f, fi) => ({
                id: f.id,
                quantidade_minima: Number(f.quantidade_minima) || 1,
                quantidade_label: (f.quantidade_label || '').trim(),
                preco: this.parseMoney(f.preco),
                destaque: Boolean(f.destaque),
                ordem: fi + 1,
              })),
          }
        }),
      }

      this.$emit('salvar', payload)
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(15, 23, 42, 0.48);
  display: flex; justify-content: center; align-items: flex-start;
  padding: 24px 16px;
  overflow-y: auto;
}

.modal {
  background: var(--surface);
  width: min(720px, 100%);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
  animation: fadeIn 0.2s ease;
  display: flex; flex-direction: column;
  margin: auto;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; gap: 12px;
}
.modal-title { font-size: 18px; font-weight: 600; margin: 0; color: var(--text); }

.close-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface-soft); color: var(--text-muted);
  cursor: pointer; transition: all 0.15s;
}
.close-btn:hover { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }
.close-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.modal-body {
  padding: 24px;
  display: flex; flex-direction: column; gap: 18px;
  overflow-y: auto; flex: 1;
}

.form-section {
  display: flex; flex-direction: column; gap: 6px;
}

label {
  font-size: 11px; color: var(--text-muted); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
}

p {
  margin: 2px 0 0; color: var(--text-muted); font-size: 12px;
}

input, select {
  font-size: 13px; height: 36px; padding: 0 10px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--text);
}
input:focus, select:focus {
  outline: none; border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(232, 110, 26, 0.1);
}

.input-full { width: 100%; }

.row-inputs {
  display: flex; gap: 8px; align-items: center;
}
.flex-1 { flex: 1; min-width: 0; }

.chips-box {
  display: flex; flex-wrap: wrap; gap: 6px;
  max-height: 160px; overflow-y: auto;
  padding: 10px; border: 1px solid var(--border);
  border-radius: var(--radius-md); background: var(--surface-soft);
  margin-top: 4px;
}

.chip {
  padding: 5px 10px; border-radius: 999px; font-size: 11px;
  font-weight: 600; cursor: pointer; border: 1px solid var(--border);
  background: var(--surface); color: var(--text-muted);
  transition: all 0.15s; user-select: none;
}
.chip:hover { border-color: var(--primary); color: var(--primary); }
.chip-active {
  background: var(--primary); color: white; border-color: var(--primary);
}

.divider {
  height: 1px; background: var(--border); margin: 4px 0;
}

.variations-header {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
}

.empty-hint {
  padding: 24px; text-align: center; color: var(--text-muted);
  border: 2px dashed var(--border); border-radius: var(--radius-md);
  font-size: 13px;
}
.empty-hint.small { padding: 12px; font-size: 12px; }

.variations-list {
  display: flex; flex-direction: column; gap: 12px;
}

.variation-card {
  border: 1px solid var(--border); border-radius: var(--radius-md);
  padding: 16px; background: var(--surface-soft);
}

.var-row {
  display: flex; align-items: flex-end; gap: 10px;
}

.var-fields {
  display: flex; gap: 10px; flex: 1; min-width: 0;
}

.field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.field-tipo { max-width: 160px; }
.field-preco { max-width: 130px; }

.toggle-faixas {
  margin-top: 10px;
}

.faixas-section {
  margin-top: 14px; padding-top: 14px;
  border-top: 1px solid var(--border);
}

.faixas-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; gap: 8px;
}
.faixas-header-actions { display: flex; gap: 6px; }
.faixas-title { font-size: 12px; font-weight: 600; color: var(--text-muted); }

.faixas-table {
  display: flex; flex-direction: column; gap: 6px;
}

.faixas-row {
  display: flex; gap: 8px; align-items: center;
}

.faixas-row.header-row {
  font-size: 10px; color: var(--text-dim); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.03em; padding-bottom: 2px;
}

.faixas-row input {
  width: 100%; height: 32px; font-size: 12px;
  padding: 0 8px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); background: var(--surface);
}
.faixas-row input:focus {
  outline: none; border-color: var(--primary);
}

.col-qtd { width: 80px; flex-shrink: 0; }
.col-label { flex: 1; min-width: 0; }
.col-preco { width: 100px; flex-shrink: 0; }
.col-destaque { width: 60px; flex-shrink: 0; display: flex; justify-content: center; }
.col-action { width: 32px; flex-shrink: 0; }

.destaque-check {
  display: flex; justify-content: center; align-items: center;
  width: 100%;
}
.destaque-check input[type="checkbox"] {
  width: auto; height: auto;
}

.imagens-section {
  border: 1px solid var(--border); border-radius: var(--radius-md);
  overflow: hidden;
}

.imagens-toggle {
  width: 100%; padding: 12px 16px; text-align: left;
  background: var(--surface-soft); border: none; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--text);
}
.imagens-toggle:hover { background: var(--surface-muted); }

.imagens-body { padding: 16px; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--border);
}

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 14px; height: 34px; border-radius: var(--radius-sm);
  border: 1px solid var(--border); cursor: pointer;
  font-weight: 600; font-size: 12px; transition: all 0.15s;
  white-space: nowrap;
}
.btn.small { height: 28px; padding: 0 10px; font-size: 11px; }
.btn.primary { background: var(--primary); color: white; border-color: var(--primary); }
.btn.primary:hover { background: var(--primary-hover); }
.btn.ghost { background: var(--surface); color: var(--text-muted); }
.btn.ghost:hover { background: var(--surface-soft); color: var(--text); }
.btn.danger { background: var(--surface); color: var(--danger); border-color: var(--border); }
.btn.danger:hover { background: var(--danger-soft); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal { width: 100%; border-radius: var(--radius-lg) var(--radius-lg) 0 0; max-height: 95vh; }
  .modal-body { padding: 16px; gap: 14px; }
  .modal-header { padding: 14px 16px; }
  .modal-footer { padding: 14px 16px; }
  .var-fields { flex-direction: column; }
  .field-tipo, .field-preco { max-width: none; }
  .faixas-row { flex-wrap: wrap; }
  .col-qtd { width: 70px; }
  .col-preco { width: 90px; }
  .col-destaque { width: 50px; }
}
</style>

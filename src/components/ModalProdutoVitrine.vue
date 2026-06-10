<template>
   <div class="modal-overlay" @keydown.escape="$emit('fechar')">
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
        <div class="coluna-esquerda">
          <div class="form-group">
            <label>Nome</label>
            <input v-model="local.name" placeholder="Ex: Caneca Naruto" />
          </div>

          <div class="form-group">
            <label>Tipo</label>
            <div class="inline-inputs grow">
              <select v-model="local.tipo">
                <option disabled value="">Selecione</option>
                <option v-for="tipo in tipos" :key="tipo" :value="tipo">
                  {{ tipo }}
                </option>
              </select>
              <input
                v-model="novoTipo"
                placeholder="Novo tipo"
                @keydown.enter.prevent="adicionarTipo"
              />
              <button class="btn ghost small" type="button" @click="adicionarTipo">
                Adicionar
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Categorias</label>

            <div class="inline-inputs grow">
              <input
                v-model="novaCategoria"
                placeholder="Nova categoria"
                @keydown.enter.prevent="adicionarCategoria"
              />
              <button class="btn ghost small" type="button" @click="adicionarCategoria">
                Incluir
              </button>
            </div>

            <div class="categorias-box">
              <div
                v-for="cat in categorias"
                :key="cat"
                :class="['categoria-item', isSelecionado(cat) ? 'ativo' : '']"
                @click="toggleCategoria(cat)"
              >
                {{ cat }}
              </div>
            </div>
          </div>

          <div class="form-group full-width">
            <div class="section-header">
              <div>
                <label>Variacoes</label>
                <p>Cadastre combinacoes, precos fixos e faixas por variacao.</p>
              </div>
              <button class="btn ghost small" type="button" @click="adicionarVariacao">
                Nova variacao
              </button>
            </div>

            <div v-if="!local.variacoes.length" class="empty-box">
              Nenhuma variacao cadastrada.
            </div>

            <div v-else class="variacoes-lista">
              <div
                v-for="(variacao, variacaoIndex) in local.variacoes"
                :key="variacao.id || `nova-${variacaoIndex}`"
                class="variacao-card"
              >
                <div class="section-header variation-header">
                  <strong>Variacao {{ variacaoIndex + 1 }}</strong>
                  <button class="btn danger small" type="button" @click="removerVariacao(variacaoIndex)">
                    Remover
                  </button>
                </div>

                <div class="inline-inputs triple">
                  <div class="form-group compact">
                    <label>Nome</label>
                    <input v-model="variacao.nome" placeholder="Ex: Branca / 33mm" />
                  </div>
                  <div class="form-group compact">
                    <label>Tipo da variacao</label>
                    <select v-model="variacao.tipo_variacao">
                      <option v-for="tipo in tiposVariacao" :key="tipo" :value="tipo">
                        {{ tipo }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group compact small-field">
                    <label>Ordem</label>
                    <input v-model.number="variacao.ordem" type="number" min="1" />
                  </div>
                </div>

                <div class="nested-section">
                  <div class="section-header">
                    <div>
                      <label>Precos fixos</label>
                      <p>Use quando a variacao tiver um ou mais precos diretos.</p>
                    </div>
                    <button class="btn ghost small" type="button" @click="adicionarPreco(variacao)">
                      Novo preco
                    </button>
                  </div>

                  <div v-if="!variacao.vitrine_precos.length" class="empty-box small">
                    Nenhum preco fixo.
                  </div>

                  <div v-else class="nested-lista">
                    <div
                      v-for="(preco, precoIndex) in variacao.vitrine_precos"
                      :key="preco.id || `preco-${precoIndex}`"
                      class="inline-inputs nested-row"
                    >
                      <div class="form-group compact">
                        <label>Preco</label>
                        <input v-model="preco.preco" type="number" min="0" step="0.01" />
                      </div>
                      <div class="form-group compact small-field">
                        <label>Ordem</label>
                        <input v-model.number="preco.ordem" type="number" min="1" />
                      </div>
                      <button class="btn danger small align-end" type="button" @click="removerPreco(variacao, precoIndex)">
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>

                <div class="nested-section">
                  <div class="section-header">
                    <div>
                      <label>Faixas de preco</label>
                      <p>Use para descontos por quantidade na mesma variacao.</p>
                    </div>
                    <button class="btn ghost small" type="button" @click="adicionarFaixa(variacao)">
                      Nova faixa
                    </button>
                  </div>

                  <div v-if="!variacao.vitrine_precos_faixas.length" class="empty-box small">
                    Nenhuma faixa de preco.
                  </div>

                  <div v-else class="nested-lista faixas">
                    <div
                      v-for="(faixa, faixaIndex) in variacao.vitrine_precos_faixas"
                      :key="faixa.id || `faixa-${faixaIndex}`"
                      class="faixa-card"
                    >
                      <div class="inline-inputs double">
                        <div class="form-group compact">
                          <label>Etiqueta</label>
                          <input v-model="faixa.quantidade_label" placeholder="Ex: 10+ unidades" />
                        </div>
                        <div class="form-group compact small-field">
                          <label>Qtd. minima</label>
                          <input v-model.number="faixa.quantidade_minima" type="number" min="1" />
                        </div>
                      </div>

                      <div class="inline-inputs triple">
                        <div class="form-group compact">
                          <label>Preco</label>
                          <input v-model="faixa.preco" type="number" min="0" step="0.01" />
                        </div>
                        <div class="form-group compact small-field">
                          <label>Ordem</label>
                          <input v-model.number="faixa.ordem" type="number" min="1" />
                        </div>
                        <label class="checkbox-field">
                          <input v-model="faixa.destaque" type="checkbox" />
                          <span>Destaque</span>
                        </label>
                      </div>

                      <button class="btn danger small" type="button" @click="removerFaixa(variacao, faixaIndex)">
                        Excluir faixa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="coluna-direita">
          <div class="form-group sticky-panel">
            <label>Imagens</label>
            <ImageManager v-model="local.images" />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn ghost" :disabled="salvando" @click="$emit('fechar')">
          Cancelar
        </button>
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
  'canecas 3d',
  'bottons',
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

export default {
  components: { ImageManager },

  props: {
    produto: {
      type: Object,
      default: () => ({}),
    },
    editando: Boolean,
    salvando: Boolean,
    tiposDisponiveis: {
      type: Array,
      default: () => [],
    },
    categoriasDisponiveis: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['salvar', 'fechar'],

  data() {
    return {
      local: this.getProdutoInicial(),
      novoTipo: '',
      novaCategoria: '',
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
        this.local = this.getProdutoInicial()
      },
    },
  },

  methods: {
    getVariacaoVazia() {
      return {
        id: null,
        nome: '',
        tipo_variacao: 'cor',
        ordem: (this.local?.variacoes?.length || 0) + 1,
        vitrine_precos: [],
        vitrine_precos_faixas: [],
      }
    },

    getPrecoVazio(lista = []) {
      return {
        id: null,
        preco: '',
        ordem: lista.length + 1,
      }
    },

    getFaixaVazia(lista = []) {
      return {
        id: null,
        quantidade_minima: 1,
        quantidade_label: '',
        preco: '',
        destaque: false,
        ordem: lista.length + 1,
      }
    },

    getProdutoInicial() {
      const variacoes = Array.isArray(this.produto?.variacoes)
        ? this.produto.variacoes
        : []

      return {
        id: this.produto?.id || null,
        name: this.produto?.name || '',
        tipo: this.produto?.tipo || '',
        categorias: Array.isArray(this.produto?.categorias)
          ? [...this.produto.categorias]
          : [],
        images: Array.isArray(this.produto?.images)
          ? [...this.produto.images]
          : [],
        variacoes: variacoes.map((variacao, index) => ({
          id: variacao.id || null,
          nome: variacao.nome || '',
          tipo_variacao: variacao.tipo_variacao || 'cor',
          ordem: variacao.ordem || index + 1,
          vitrine_precos: Array.isArray(variacao.vitrine_precos)
            ? variacao.vitrine_precos.map((preco, precoIndex) => ({
              id: preco.id || null,
              preco: preco.preco ?? '',
              ordem: preco.ordem || precoIndex + 1,
            }))
            : [],
          vitrine_precos_faixas: Array.isArray(variacao.vitrine_precos_faixas)
            ? variacao.vitrine_precos_faixas.map((faixa, faixaIndex) => ({
              id: faixa.id || null,
              quantidade_minima: faixa.quantidade_minima ?? 1,
              quantidade_label: faixa.quantidade_label || '',
              preco: faixa.preco ?? '',
              destaque: Boolean(faixa.destaque),
              ordem: faixa.ordem || faixaIndex + 1,
            }))
            : [],
        })),
      }
    },

    toggleCategoria(cat) {
      const existe = this.local.categorias.includes(cat)

      if (existe) {
        this.local.categorias = this.local.categorias.filter((categoria) => categoria !== cat)
      } else {
        this.local.categorias = [...this.local.categorias, cat]
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
        this.local.categorias = [...this.local.categorias, categoria]
      }
      this.novaCategoria = ''
    },

    adicionarVariacao() {
      this.local.variacoes = [...this.local.variacoes, this.getVariacaoVazia()]
    },

    removerVariacao(index) {
      this.local.variacoes.splice(index, 1)
    },

    adicionarPreco(variacao) {
      variacao.vitrine_precos.push(this.getPrecoVazio(variacao.vitrine_precos))
    },

    removerPreco(variacao, index) {
      variacao.vitrine_precos.splice(index, 1)
    },

    adicionarFaixa(variacao) {
      variacao.vitrine_precos_faixas.push(this.getFaixaVazia(variacao.vitrine_precos_faixas))
    },

    removerFaixa(variacao, index) {
      variacao.vitrine_precos_faixas.splice(index, 1)
    },

    salvar() {
      const payload = {
        ...this.local,
        name: this.local.name.trim(),
        tipo: this.local.tipo.trim(),
        categorias: this.local.categorias.map((categoria) => categoria.trim()).filter(Boolean),
        variacoes: this.local.variacoes.map((variacao, index) => ({
          ...variacao,
          nome: (variacao.nome || '').trim(),
          tipo_variacao: variacao.tipo_variacao || 'cor',
          ordem: Number(variacao.ordem) || index + 1,
          vitrine_precos: variacao.vitrine_precos.map((preco, precoIndex) => ({
            ...preco,
            ordem: Number(preco.ordem) || precoIndex + 1,
          })),
          vitrine_precos_faixas: variacao.vitrine_precos_faixas.map((faixa, faixaIndex) => ({
            ...faixa,
            quantidade_label: (faixa.quantidade_label || '').trim(),
            quantidade_minima: Number(faixa.quantidade_minima) || 1,
            ordem: Number(faixa.ordem) || faixaIndex + 1,
            destaque: Boolean(faixa.destaque),
          })),
        })),
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
  display: flex; justify-content: center; align-items: center;
  padding: 16px;
}

.modal {
  background: var(--surface);
  width: min(1180px, 100%);
  max-height: calc(100vh - 32px);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
  overflow: hidden;
  animation: fadeIn 0.2s ease;
  display: flex; flex-direction: column;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--border);
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
  padding: 20px;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 20px;
  overflow-y: auto;
  flex: 1;
}

.coluna-esquerda,
.coluna-direita {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sticky-panel {
  position: sticky;
  top: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.compact {
  gap: 4px;
}

.full-width {
  width: 100%;
}

label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

input,
select {
  font-size: 13px;
}

.inline-inputs {
  display: grid;
  gap: 8px;
  align-items: end;
}

.inline-inputs.grow {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
}

.inline-inputs.double {
  grid-template-columns: minmax(0, 1fr) 150px;
}

.inline-inputs.triple {
  grid-template-columns: minmax(0, 1fr) minmax(180px, 220px) 120px;
}

.inline-inputs.nested-row {
  grid-template-columns: minmax(0, 1fr) 120px auto;
}

.small-field {
  max-width: 140px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.variation-header {
  align-items: center;
}

.categorias-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-soft);
}

.categoria-item {
  padding: 7px 12px;
  background: var(--surface);
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--border);
  font-weight: 600;
}

.categoria-item.ativo {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-color: transparent;
}

.variacoes-lista,
.nested-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variacao-card,
.faixa-card,
.empty-box,
.nested-section {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface-soft);
}

.variacao-card,
.faixa-card,
.nested-section {
  padding: 14px;
}

.nested-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.empty-box {
  padding: 16px;
  color: var(--text-muted);
}

.empty-box.small {
  padding: 12px 14px;
}

.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.align-end {
  align-self: end;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.btn {
  padding: 0 12px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.15s;
}

.btn.small {
  padding: 0 10px;
  font-size: 12px;
}

.btn.primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.btn.primary:hover {
  background: var(--primary-hover);
}

.btn.ghost {
  background: var(--surface);
  color: var(--text-muted);
}

.btn.ghost:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.btn.danger {
  background: var(--surface);
  color: var(--danger);
  border-color: var(--border);
}

.btn.danger:hover {
  background: var(--danger-soft);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .modal-body {
    grid-template-columns: 1fr;
  }
  .sticky-panel {
    position: static;
  }
}

@media (max-width: 700px) {
  .modal {
    width: 100%;
  }
  .inline-inputs.grow, .inline-inputs.double, .inline-inputs.triple, .inline-inputs.nested-row, .modal-footer, .section-header {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
  .small-field {
    max-width: none;
  }
  .btn {
    width: 100%;
  }
  .variation-header .btn, .section-header .btn {
    width: auto;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

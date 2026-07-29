<template>
   <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal" role="dialog" aria-modal="true">

      <div class="modal-header">
        <h2 class="modal-title">{{ editando ? 'Editar Venda' : 'Nova Venda' }}</h2>
        <button class="close-btn" aria-label="Fechar" @click="$emit('fechar')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- ERROS -->
        <div v-if="erros.length" class="erro-box">
          <div v-for="(e, i) in erros" :key="i" class="erro-msg">{{ e }}</div>
        </div>

        <div class="form-grid">
          <div class="field" :class="{ erro: campoErro('cliente') }">
            <label>Cliente *</label>
            <input v-model="venda.cliente" placeholder="Nome do cliente" />
          </div>
          <div class="field" :class="{ erro: campoErro('data') }">
            <label>Data *</label>
            <input v-model="venda.data_venda" type="date" />
          </div>
        </div>

        <div class="add-row">
          <select v-model="produtoSelecionado">
            <option disabled value="">Selecione um produto</option>
            <option v-for="p in produtos" :key="p.id" :value="p.id">
              {{ p.nome }} — R$ {{ formatar(p.preco_venda) }}
            </option>
          </select>
          <button class="btn btn-ghost" @click="adicionarProduto">+ Adicionar</button>
        </div>

        <div class="items-list">
          <div v-if="venda.itens.length === 0" class="empty-state" :class="{ erro: campoErro('itens') }">
            Nenhum produto adicionado
          </div>
          <div v-for="(item, i) in venda.itens" :key="i" class="item-row">
            <span class="item-name">{{ item.nome }}</span>
            <input v-model.number="item.quantidade" type="number" min="1" class="item-qty" @input="atualizar(item)" />
            <span class="item-price">R$ {{ formatar(item.preco) }}</span>
            <span class="item-subtotal">R$ {{ formatar(item.subtotal) }}</span>
            <button class="btn btn-danger btn-icon" aria-label="Remover" @click="remover(i)">×</button>
          </div>
        </div>

        <div class="summary">
          <div class="summary-row">
            <span>Total</span>
            <strong>R$ {{ formatar(venda.total_bruto) }}</strong>
          </div>
          <div class="summary-row">
            <span>Desconto</span>
          </div>
          <div class="desconto-duplo">
            <div class="desconto-campo">
              <input
                v-model="descontoPercentual"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
                @input="onDescontoPercentual"
              />
              <span class="desconto-sufixo">%</span>
            </div>
            <span class="desconto-ou">ou</span>
            <div class="desconto-campo">
              <span class="desconto-prefixo">R$</span>
              <input
                v-model="descontoValor"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
                @change="onDescontoValor"
              />
            </div>
          </div>
          <div class="summary-row summary-total">
            <span>Total Final</span>
            <strong>R$ {{ formatar(venda.total_final) }}</strong>
          </div>
          <div class="summary-row" :class="{ erro: campoErro('pagamento') }">
            <span>Pagamento *</span>
            <select v-model="venda.forma_pagamento" @change="onFormaPagamentoChange">
              <option value="">Selecione</option>
              <option>Pix</option>
              <option>Dinheiro</option>
              <option>Credito</option>
            </select>
          </div>
          <div v-if="mostrarParcelas" class="summary-row" :class="{ erro: campoErro('parcelas') }">
            <span>Parcelas *</span>
            <select v-model="venda.parcelas" @change="atualizarValorParcela">
              <option v-for="n in 12" :key="n" :value="n">{{ n }}x</option>
            </select>
          </div>
          <div v-if="mostrarParcelas && valorParcela > 0" class="summary-row valor-parcela">
            <span>Valor da Parcela</span>
            <strong>{{ venda.parcelas }}x de R$ {{ formatar(valorParcela) }}</strong>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary" :disabled="isLoading" @click="submit">
          {{ isLoading ? 'Processando...' : editando ? 'Atualizar Venda' : 'Finalizar Venda' }}
        </button>
        <button class="btn btn-ghost" :disabled="isLoading" @click="$emit('fechar')">Cancelar</button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  props: {
    produtos: { type: Array, default: () => [] },
    editando: { type: Boolean, default: false },
    vendaInicial: { type: Object, default: null },
  },
  emits: ['fechar', 'salvar'],
  data() {
    const venda = this.vendaInicial || {
      cliente: '',
      data_venda: this.getHoje(),
      itens: [],
      desconto: 0,
      total_bruto: 0,
      total_final: 0,
      forma_pagamento: '',
      parcelas: 1,
    }
    const descontoPct = venda.desconto || 0
    const descontoR$ = venda.total_bruto ? (venda.total_bruto * descontoPct / 100) : 0
    return {
      isLoading: false,
      produtoSelecionado: '',
      erros: [],
      venda,
      descontoPercentual: descontoPct ? String(descontoPct).replace('.', ',') : '',
      descontoValor: descontoR$ ? this.formatar(descontoR$) : '',
    }
  },
  computed: {
    mostrarParcelas() { return this.venda.forma_pagamento === 'Credito' },
    valorParcela() {
      if (!this.mostrarParcelas) return 0
      const parcelas = Number(this.venda.parcelas) || 1
      return Number((this.venda.total_final / parcelas).toFixed(2))
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
    getHoje() { return new Date().toISOString().split('T')[0] },
    formatar(v) { return Number(v || 0).toFixed(2).replace('.', ',') },

    campoErro(campo) { return this.erros.some(e => e.campo === campo) },

    onFormaPagamentoChange() {
      if (!this.mostrarParcelas) this.venda.parcelas = 1
      this.erros = this.erros.filter(e => e.campo !== 'pagamento' && e.campo !== 'parcelas')
    },

    atualizarValorParcela() {
      this.erros = this.erros.filter(e => e.campo !== 'parcelas')
    },

    adicionarProduto() {
      if (!this.produtoSelecionado) return
      const produto = this.produtos.find(p => p.id === this.produtoSelecionado)
      if (!produto) return
      const existente = this.venda.itens.find(i => i.produto_id === produto.id)
      if (existente) { existente.quantidade++; this.atualizar(existente) }
      else {
        this.venda.itens.push({
          produto_id: produto.id,
          nome: produto.nome,
          preco: produto.preco_venda,
          quantidade: 1,
          subtotal: produto.preco_venda,
        })
      }
      this.erros = this.erros.filter(e => e.campo !== 'itens')
      this.recalcular()
      this.produtoSelecionado = ''
    },

    atualizar(item) {
      item.subtotal = item.quantidade * item.preco
      this.recalcular()
    },

    remover(i) {
      this.venda.itens.splice(i, 1)
      this.recalcular()
    },

    recalcular() {
      this.venda.total_bruto = this.venda.itens.reduce((t, i) => t + i.subtotal, 0)
      const desconto = parseFloat(this.venda.desconto || 0)
      this.venda.total_final = Math.max(this.venda.total_bruto - (this.venda.total_bruto * desconto / 100), 0)
    },

    onDescontoPercentual() {
      const pct = this.parseMoney(this.descontoPercentual)
      this.venda.desconto = Math.min(pct, 100)
      const valor = (this.venda.total_bruto * this.venda.desconto) / 100
      this.descontoValor = valor > 0 ? this.formatar(valor) : ''
      this.recalcular()
    },

    onDescontoValor() {
      const valor = this.parseMoney(this.descontoValor)
      if (this.venda.total_bruto > 0) {
        const pct = Math.min((valor / this.venda.total_bruto) * 100, 100)
        this.venda.desconto = Number(pct.toFixed(2))
        this.descontoPercentual = pct > 0 ? pct.toFixed(2).replace('.', ',') : ''
      } else {
        this.venda.desconto = 0
        this.descontoPercentual = ''
      }
      this.descontoValor = valor > 0 ? this.formatar(valor) : ''
      this.recalcular()
    },

    parseMoney(value) {
      if (!value) return 0
      return parseFloat(String(value).replace(',', '.')) || 0
    },

    validar() {
      const erros = []

      if (!this.venda.cliente?.trim()) {
        erros.push({ campo: 'cliente', msg: 'Nome do cliente é obrigatório' })
      }

      if (!this.venda.data_venda) {
        erros.push({ campo: 'data', msg: 'Data é obrigatória' })
      }

      if (!this.venda.itens.length) {
        erros.push({ campo: 'itens', msg: 'Adicione pelo menos um produto' })
      }

      const itemInvalido = this.venda.itens.some(i => !i.quantidade || i.quantidade < 1)
      if (itemInvalido) {
        erros.push({ campo: 'itens', msg: 'Quantidade de cada item deve ser no mínimo 1' })
      }

      if (!this.venda.forma_pagamento) {
        erros.push({ campo: 'pagamento', msg: 'Forma de pagamento é obrigatória' })
      }

      if (this.mostrarParcelas && (!this.venda.parcelas || this.venda.parcelas < 1)) {
        erros.push({ campo: 'parcelas', msg: 'Número de parcelas é obrigatório para crédito' })
      }

      this.erros = erros
      return erros.length === 0
    },

    submit() {
      if (this.isLoading) return

      if (!this.validar()) return

      this.erros = []
      this.isLoading = true
      this.$emit('salvar', this.venda)
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(15, 23, 42, 0.48);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

.modal {
  background: var(--surface);
  width: 100%; max-width: 1280px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  max-height: calc(100vh - 32px);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
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

.modal-body { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }

.erro-box {
  background: var(--danger-soft);
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex; flex-direction: column; gap: 4px;
}

.erro-msg {
  font-size: 12px;
  color: var(--danger);
  font-weight: 500;
}

.field.erro input,
.field.erro select,
.empty-state.erro {
  border-color: var(--danger) !important;
}

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.field.erro label { color: var(--danger); }
.field input, .field select { font-size: 13px; }

.add-row { display: flex; gap: 10px; }
.add-row select { flex: 1; }

.items-list { display: flex; flex-direction: column; gap: 6px; }
.empty-state { text-align: center; padding: 16px; color: var(--text-muted); font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-sm); }

.item-row {
  display: grid; grid-template-columns: 1fr 64px 80px 80px 32px; gap: 8px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  background: var(--surface-soft); border: 1px solid var(--border);
  align-items: center; font-size: 13px;
}
.item-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-qty { text-align: center; width: 64px; height: 32px; padding: 0; }
.item-price { color: var(--text-muted); text-align: right; }
.item-subtotal { font-weight: 600; text-align: right; }

.summary {
  background: var(--surface-soft); padding: 14px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 8px;
}
.summary-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.summary-row.erro select { border-color: var(--danger); }
.summary-total { font-size: 16px; font-weight: 700; color: var(--primary); padding-top: 8px; border-top: 1px solid var(--border); margin-top: 4px; }
.valor-parcela { background: var(--primary-soft); padding: 8px 10px; border-radius: var(--radius-sm); }
.valor-parcela strong { color: var(--primary); font-size: 14px; }
.input-group { display: flex; align-items: center; gap: 4px; }
.input-group input { width: 60px; height: 32px; text-align: center; padding: 0; }

.desconto-duplo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 4px;
}

.desconto-campo {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
}

.desconto-campo input {
  width: 100%;
  height: 34px;
  padding: 0 28px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
}

.desconto-campo input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(232, 110, 26, 0.1);
}

.desconto-sufixo {
  position: absolute;
  right: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  pointer-events: none;
}

.desconto-prefixo {
  position: absolute;
  left: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  pointer-events: none;
  z-index: 1;
}

.desconto-ou {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  flex-shrink: 0;
}

.modal-footer { display: flex; gap: 8px; padding: 16px 20px; border-top: 1px solid var(--border); flex-shrink: 0; }

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 16px; height: 36px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  cursor: pointer; font-weight: 600; font-size: 13px;
  transition: all 0.15s; white-space: nowrap;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--primary); color: white; border-color: var(--primary); }
.btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
.btn-ghost { background: var(--surface); color: var(--text); }
.btn-ghost:hover:not(:disabled) { background: var(--surface-soft); }
.btn-danger { width: 32px; height: 32px; padding: 0; background: var(--surface); color: var(--danger); font-size: 16px; }
.btn-danger:hover { background: var(--danger-soft); }
.btn-icon { flex-shrink: 0; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .add-row { flex-direction: column; }
  .item-row { grid-template-columns: 1fr auto auto 28px; }
  .item-price { display: none; }
  .modal-footer { flex-direction: column; }
  .modal-footer .btn { width: 100%; }
}
</style>

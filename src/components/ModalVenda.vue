<template>
   <div class="modal-overlay" @click.self="$emit('fechar')" @keydown.escape="$emit('fechar')">
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
        <div class="form-grid">
          <div class="field">
            <label>Cliente</label>
            <input v-model="venda.cliente" placeholder="—" />
          </div>
          <div class="field">
            <label>Data</label>
            <input v-model="venda.data_venda" type="date" />
          </div>
        </div>

        <div class="add-row">
          <select v-model="produtoSelecionado">
            <option disabled value="">Selecione um produto</option>
            <option v-for="p in produtos" :key="p.id" :value="p">
              {{ p.nome }} — R$ {{ formatar(p.preco_venda) }}
            </option>
          </select>
          <button class="btn btn-ghost" @click="adicionarProduto">+ Adicionar</button>
        </div>

        <div class="items-list">
          <div v-if="venda.itens.length === 0" class="empty-state">Nenhum produto adicionado</div>
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
            <span>Desconto (%)</span>
            <div class="input-group">
              <input v-model="venda.desconto" type="number" min="0" max="100" @input="recalcular" />
              <span>%</span>
            </div>
          </div>
          <div class="summary-row summary-total">
            <span>Total Final</span>
            <strong>R$ {{ formatar(venda.total_final) }}</strong>
          </div>
          <div class="summary-row">
            <span>Pagamento</span>
            <select v-model="venda.forma_pagamento" @change="onFormaPagamentoChange">
              <option value="">Selecione</option>
              <option>Pix</option>
              <option>Dinheiro</option>
              <option>Credito</option>
            </select>
          </div>
          <div v-if="mostrarParcelas" class="summary-row">
            <span>Parcelas</span>
            <select v-model="venda.parcelas">
              <option v-for="n in 12" :key="n" :value="n">{{ n }}x</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary" :disabled="isLoading" @click="submit">
          {{ isLoading ? 'Processando...' : editando ? 'Atualizar' : 'Finalizar Venda' }}
        </button>
        <button class="btn btn-ghost" :disabled="isLoading" @click="$emit('fechar')">Cancelar</button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  props: { produtos: { type: Array, default: () => [] }, editando: { type: Boolean, default: false }, vendaInicial: { type: Object, default: null } },
  emits: ['fechar', 'salvar'],
  data() {
    return {
      isLoading: false,
      produtoSelecionado: '',
      venda: this.vendaInicial || {
        cliente: '', data_venda: this.getHoje(), itens: [],
        desconto: 0, total_bruto: 0, total_final: 0,
        forma_pagamento: '', parcelas: 1
      }
    }
  },
  computed: { mostrarParcelas() { return this.venda.forma_pagamento === 'Credito' } },
  methods: {
    getHoje() { return new Date().toISOString().split('T')[0] },
    formatar(v) { return Number(v || 0).toFixed(2).replace('.', ',') },
    onFormaPagamentoChange() { if (!this.mostrarParcelas) this.venda.parcelas = 1 },
    adicionarProduto() {
      if (!this.produtoSelecionado) return
      const existente = this.venda.itens.find(i => i.produto_id === this.produtoSelecionado.id)
      if (existente) { existente.quantidade++; this.atualizar(existente) }
      else {
        this.venda.itens.push({
          produto_id: this.produtoSelecionado.id,
          nome: this.produtoSelecionado.nome,
          preco: this.produtoSelecionado.preco_venda,
          quantidade: 1, subtotal: this.produtoSelecionado.preco_venda
        })
      }
      this.recalcular(); this.produtoSelecionado = ''
    },
    atualizar(item) { item.subtotal = item.quantidade * item.preco; this.recalcular() },
    remover(i) { this.venda.itens.splice(i, 1); this.recalcular() },
    recalcular() {
      this.venda.total_bruto = this.venda.itens.reduce((t, i) => t + i.subtotal, 0)
      const desconto = parseFloat(this.venda.desconto || 0)
      this.venda.total_final = Math.max(this.venda.total_bruto - (this.venda.total_bruto * desconto / 100), 0)
    },
    async submit() {
      if (this.isLoading) return
      if (this.venda.itens.length === 0) { alert('Adicione produtos'); return }
      this.isLoading = true
      try { this.$emit('salvar', this.venda) }
      catch (error) { console.error('Erro ao salvar venda:', error) }
      finally { this.isLoading = false }
    }
  }
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
  width: 100%; max-width: 1024px;
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

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.field input, .field select { font-size: 13px; }

.add-row { display: flex; gap: 10px; }
.add-row select { flex: 1; }

.items-list { display: flex; flex-direction: column; gap: 6px; }
.empty-state { text-align: center; padding: 16px; color: var(--text-muted); font-size: 13px; }

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
.summary-total { font-size: 16px; font-weight: 700; color: var(--primary); padding-top: 8px; border-top: 1px solid var(--border); margin-top: 4px; }
.input-group { display: flex; align-items: center; gap: 4px; }
.input-group input { width: 60px; height: 32px; text-align: center; padding: 0; }

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
.btn-danger { width: 32px; height: 32px; padding: 0; background: var(--surface); color: var(--danger); font-size: 16px; padding: 0; }
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
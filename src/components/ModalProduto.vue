<template>
   <div class="modal-overlay" @click.self="$emit('fechar')" @keydown.escape="$emit('fechar')">
    <div class="modal" role="dialog" aria-modal="true">

      <div class="modal-header">
        <h2 class="modal-title">{{ editando ? 'Editar Produto' : 'Novo Produto' }}</h2>
        <button class="close-btn" aria-label="Fechar" @click="$emit('fechar')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form class="modal-body" @submit.prevent="submit">
        <div class="field">
          <label>Nome do Produto</label>
          <input v-model="localProduto.nome" required />
        </div>

        <div class="field">
          <label>Código</label>
          <input v-model="localProduto.codigo" />
        </div>

        <div class="form-row">
          <div class="field">
            <label>Preço Custo (R$)</label>
            <input v-model="localProduto.preco_custo" />
          </div>
          <div class="field">
            <label>Preço de Venda (R$)</label>
            <input v-model="localProduto.preco_venda" required />
          </div>
        </div>

        <div class="field">
          <label>Estoque</label>
          <input v-model.number="localProduto.estoque" type="number" />
        </div>

        <div class="checkbox-row">
          <input id="ativo-check" v-model="localProduto.ativo" type="checkbox" />
          <label for="ativo-check">Produto ativo</label>
        </div>
      </form>

      <div class="modal-footer">
        <button class="btn btn-primary" type="submit" :disabled="isLoading" @click="submit">
          {{ isLoading ? 'Processando...' : editando ? 'Atualizar' : 'Salvar' }}
        </button>
        <button class="btn btn-ghost" type="button" :disabled="isLoading" @click="$emit('fechar')">Cancelar</button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  props: { produto: { type: Object, default: () => ({}) }, editando: { type: Boolean, default: false } },
  emits: ['fechar', 'salvar'],
  data() { return { isLoading: false, localProduto: { ...this.produto } } },
  methods: {
    parseMoney(value) { if (!value) return 0; return parseFloat(value.toString().replace(',', '.')) || 0 },
    async submit() {
      if (this.isLoading) return
      this.isLoading = true
      try {
        const produtoTratado = {
          ...this.localProduto,
          preco_custo: this.parseMoney(this.localProduto.preco_custo),
          preco_venda: this.parseMoney(this.localProduto.preco_venda)
        }
        this.$emit('salvar', produtoTratado)
      } catch (error) { console.error('Erro ao salvar produto:', error) }
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
  width: 100%; max-width: 420px;
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

.modal-body { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px; }

.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.field input { font-size: 13px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.checkbox-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: var(--surface-soft);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
}
.checkbox-row input { width: 16px; height: 16px; min-height: auto; flex-shrink: 0; }
.checkbox-row label { color: var(--text); font-weight: 500; font-size: 13px; cursor: pointer; }

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

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .modal-footer { flex-direction: column; }
  .modal-footer .btn { width: 100%; }
  input { font-size: 15px; }
}
</style>
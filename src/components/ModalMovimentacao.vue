<template>
   <div class="modal-overlay" @click.self="$emit('fechar')" @keydown.escape="$emit('fechar')">
    <div class="modal" role="dialog" aria-modal="true">

      <div class="modal-header">
        <h2 class="modal-title">{{ tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque' }}</h2>
        <button class="close-btn" aria-label="Fechar" @click="$emit('fechar')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form class="modal-body" @submit.prevent="salvar">
        <div class="product-info">{{ produto.nome }}</div>

        <div class="field">
          <label>Quantidade</label>
          <input v-model.number="quantidade" type="number" min="1" placeholder="0" />
        </div>

        <div class="field">
          <label>Observação</label>
          <input v-model="observacao" placeholder="—" />
        </div>
      </form>

      <div class="modal-footer">
        <button class="btn btn-primary" type="submit" @click="salvar">Salvar</button>
        <button class="btn btn-ghost" @click="$emit('fechar')">Cancelar</button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  props: { produto: { type: Object, default: () => ({}) }, tipo: { type: String, default: 'entrada' } },
  emits: ['fechar', 'salvar'],
  data() { return { quantidade: 1, observacao: '' } },
  methods: {
    salvar() {
      if (!this.quantidade || this.quantidade <= 0) { alert('Quantidade inválida'); return }
      this.$emit('salvar', { quantidade: this.quantidade, observacao: this.observacao })
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
  width: 100%; max-width: 380px;
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

.modal-title { font-size: 16px; font-weight: 600; margin: 0; color: var(--text); }

.close-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface-soft); color: var(--text-muted);
  cursor: pointer; transition: all 0.15s;
}
.close-btn:hover { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }

.modal-body { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px; }

.product-info {
  background: var(--surface-soft); padding: 10px 12px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  font-weight: 500; font-size: 13px; color: var(--text);
}

.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.field input { font-size: 13px; }

.modal-footer { display: flex; gap: 8px; padding: 16px 20px; border-top: 1px solid var(--border); flex-shrink: 0; }

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 16px; height: 36px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  cursor: pointer; font-weight: 600; font-size: 13px;
  transition: all 0.15s; white-space: nowrap;
}
.btn-primary { background: var(--primary); color: white; border-color: var(--primary); }
.btn-primary:hover { background: var(--primary-hover); }
.btn-ghost { background: var(--surface); color: var(--text); }
.btn-ghost:hover { background: var(--surface-soft); }

@media (max-width: 600px) {
  .modal-footer { flex-direction: column; }
  .modal-footer .btn { width: 100%; }
}
</style>
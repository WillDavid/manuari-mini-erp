<template>
  <div class="modal-overlay">
    <div class="modal">

      <div class="modal-header">
        <h2>{{ editando ? 'Editar Movimentacao' : 'Nova Movimentacao' }}</h2>
        <button class="close" @click="$emit('fechar')">×</button>
      </div>

      <form @submit.prevent="submit">

        <div class="field">
          <label>Tipo</label>
          <div class="toggle-tipo">
            <button
              type="button"
              :class="['tipo-btn', localMovimentacao.tipo === 'entrada' ? 'ativo entrada' : '']"
              @click="localMovimentacao.tipo = 'entrada'"
            >
              Entrada
            </button>
            <button
              type="button"
              :class="['tipo-btn', localMovimentacao.tipo === 'saida' ? 'ativo saida' : '']"
              @click="localMovimentacao.tipo = 'saida'"
            >
              Saída
            </button>
          </div>
        </div>

        <div class="field">
          <label>Descricao</label>
          <input v-model="localMovimentacao.descricao" required />
        </div>

        <div class="row">
          <div class="field">
            <label>Valor (R$)</label>
            <input v-model.number="localMovimentacao.valor" type="number" step="0.01" min="0" required />
          </div>

          <div class="field">
            <label>Data</label>
            <input v-model="localMovimentacao.data" type="date" required />
          </div>
        </div>

        <div class="field">
          <label>Forma de Pagamento</label>
          <select v-model="localMovimentacao.forma_pagamento" required>
            <option disabled value="">Selecione</option>
            <option>Dinheiro</option>
            <option>Pix</option>
            <option>Transferencia</option>
            <option>Cartao debito</option>
            <option>Cartao credito</option>
            <option>Debito automatico</option>
          </select>
        </div>

        <div class="actions">
          <button class="primary" type="submit">
            {{ editando ? 'Atualizar' : 'Salvar' }}
          </button>

          <button class="secondary" type="button" @click="$emit('fechar')">
            Cancelar
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: ['movimentacao', 'editando'],

  data() {
    return {
      localMovimentacao: { ...this.movimentacao }
    }
  },

  methods: {
    submit() {
      const mov = {
        ...this.localMovimentacao,
        valor: Number(this.localMovimentacao.valor) || 0
      }
      this.$emit('salvar', mov)
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  background: var(--surface);
  width: 100%;
  max-width: 480px;
  border-radius: var(--radius-md);
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: var(--shadow-md);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.modal-header h2 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.close {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}

.field label {
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-weight: 600;
}

.row {
  display: flex;
  gap: 12px;
}

.toggle-tipo {
  display: flex;
  gap: 8px;
}

.tipo-btn {
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-soft);
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
}

.tipo-btn.ativo.entrada {
  background: var(--success-soft);
  border-color: var(--success);
  color: var(--success);
}

.tipo-btn.ativo.saida {
  background: var(--danger-soft);
  border-color: var(--danger);
  color: var(--danger);
}

input,
select {
  background: var(--surface);
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

button {
  border: 1px solid transparent;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.22);
}

.secondary {
  background: var(--surface-soft);
  border-color: var(--border);
  color: var(--text);
}

@media (max-width: 600px) {
  .modal {
    padding: 16px;
    border-radius: 14px;
  }

  .row {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }

  input,
  select {
    font-size: 16px;
  }
}
</style>
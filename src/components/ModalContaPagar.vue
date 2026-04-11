<template>
  <div class="modal-overlay">
    <div class="modal">

      <div class="modal-header">
        <h2>{{ editando ? 'Editar' : 'Nova Conta a Pagar' }}</h2>
        <button class="close" @click="$emit('fechar')">×</button>
      </div>

      <form @submit.prevent="submit">

        <div class="field">
          <label>Descricao</label>
          <input v-model="localConta.descricao" required />
        </div>

        <div class="row">
          <div class="field">
            <label>Valor (R$)</label>
            <input v-model.number="localConta.valor" type="number" step="0.01" min="0" required />
          </div>

          <div class="field">
            <label>Vencimento</label>
            <input v-model="localConta.data_vencimento" type="date" required />
          </div>
        </div>

        <div class="field">
          <label>Forma de Pagamento</label>
          <select v-model="localConta.forma_pagamento" required>
            <option disabled value="">Selecione</option>
            <option>Dinheiro</option>
            <option>Transferencia</option>
            <option>Debito automatico</option>
          </select>
        </div>

        <div class="actions">
          <button class="primary" type="submit" :disabled="isLoading">
            {{ isLoading ? 'Processando...' : editando ? 'Atualizar' : 'Salvar' }}
          </button>

          <button class="secondary" type="button" @click="$emit('fechar')" :disabled="isLoading">
            Cancelar
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: ['conta', 'editando'],

  data() {
    return {
      isLoading: false,
      localConta: { ...conta }
    }
  },

  methods: {
    submit() {
      if (this.isLoading) return
      this.isLoading = true

      const conta = {
        ...this.localConta,
        valor: Number(this.localConta.valor) || 0
      }
      this.$emit('salvar', conta)
      setTimeout(() => { this.isLoading = false }, 500)
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
  max-width: 450px;
  border-radius: var(--radius-md);
  padding: 24px;
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

input, select {
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
}

.secondary {
  background: var(--surface-soft);
  border-color: var(--border);
  color: var(--text);
}

@media (max-width: 500px) {
  .row {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }
}
</style>
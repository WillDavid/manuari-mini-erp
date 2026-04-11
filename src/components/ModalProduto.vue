<template>
  <div class="modal-overlay">
    <div class="modal">

      <div class="modal-header">
        <h2>{{ editando ? 'Editar Produto' : 'Novo Produto' }}</h2>
        <button class="close" @click="$emit('fechar')">×</button>
      </div>

      <form @submit.prevent="submit">

        <div class="field">
          <label>Nome do Produto</label>
          <input v-model="localProduto.nome" required />
        </div>

        <div class="field">
          <label>Código</label>
          <input v-model="localProduto.codigo" />
        </div>

        <div class="row">
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
          <input type="number" v-model.number="localProduto.estoque" />
        </div>

        <div class="checkbox">
          <input type="checkbox" v-model="localProduto.ativo" />
          <label>Produto ativo</label>
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
  props: ['produto', 'editando'],

  data() {
    return {
      localProduto: { ...this.produto }
    }
  },

  methods: {
    parseMoney(value) {
      if (!value) return 0
      return parseFloat(
        value.toString().replace(',', '.')
      ) || 0
    },

    submit() {
      const produtoTratado = {
        ...this.localProduto,
        preco_custo: this.parseMoney(this.localProduto.preco_custo),
        preco_venda: this.parseMoney(this.localProduto.preco_venda)
      }

      this.$emit('salvar', produtoTratado)
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

input {
  background: var(--surface);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 12px 14px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
}

.checkbox input {
  width: 18px;
  min-height: auto;
}

.checkbox label {
  color: var(--text);
  font-weight: 600;
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

  input {
    font-size: 16px;
  }
}
</style>

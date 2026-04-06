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
            <label>Preço de Compra (R$)</label>
            <input v-model="localProduto.preco_compra" />
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
        preco_compra: this.parseMoney(this.localProduto.preco_compra),
        preco_venda: this.parseMoney(this.localProduto.preco_venda)
      }

      this.$emit('salvar', produtoTratado)
    }
  }
}
</script>

<style scoped>.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 16px; /* respiro nas bordas */
}

/* MODAL */
.modal {
  background: white;
  width: 100%;
  max-width: 480px;

  border-radius: 12px;
  padding: 20px;

  max-height: 90vh;
  overflow-y: auto;

  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

/* HEADER */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 16px;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close {
  background: none;
  font-size: 20px;
  cursor: pointer;
}

/* FORM */
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.field label {
  font-size: 13px;
  margin-bottom: 4px;
  color: #555;
}

/* ROW (desktop) */
.row {
  display: flex;
  gap: 10px;
}

/* INPUT */
input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

/* CHECKBOX */
.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

button {
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.primary {
  background: #ff6a00;
  color: white;
}

.secondary {
  background: #ccc;
}

/* 📱 RESPONSIVO */
@media (max-width: 600px) {

  .modal {
    padding: 16px;
    border-radius: 10px;
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
    font-size: 16px; /* evita zoom no iOS */
  }
}
</style>
<template>
  <div class="overlay" @click.self="$emit('fechar')">
    <div class="modal">

      <!-- HEADER -->
      <div class="header">
        <div>
          <h3>
            {{ tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque' }}
          </h3>
          <span class="badge" :class="tipo">
            {{ tipo }}
          </span>
        </div>

        <button class="close" @click="$emit('fechar')">×</button>
      </div>

      <!-- PRODUTO -->
      <div class="produto">
        {{ produto.nome }}
      </div>

      <!-- FORM -->
      <div class="field">
        <label>Quantidade</label>
        <input 
          type="number" 
          v-model.number="quantidade" 
          min="1"
          placeholder="Digite a quantidade"
        />
      </div>

      <div class="field">
        <label>Observação</label>
        <input 
          v-model="observacao" 
          placeholder="Ex: reposição, ajuste, etc"
        />
      </div>

      <!-- ACTIONS -->
      <div class="actions">
        <button class="primary" @click="salvar">
          Salvar
        </button>

        <button class="secondary" @click="$emit('fechar')">
          Cancelar
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  props: ['produto', 'tipo'],

  data() {
    return {
      quantidade: 1,
      observacao: ''
    }
  },

  methods: {
    salvar() {
      if (!this.quantidade || this.quantidade <= 0) {
        alert('Quantidade inválida')
        return
      }

      this.$emit('salvar', {
        quantidade: this.quantidade,
        observacao: this.observacao
      })
    }
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 380px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  animation: fadeIn 0.2s ease;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header h3 {
  font-size: 18px;
  margin: 0;
}

/* BADGE */
.badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  margin-top: 4px;
  display: inline-block;
}

.badge.entrada {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge.saida {
  background: #fdecea;
  color: #c62828;
}

/* CLOSE */
.close {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  color: #555;
  transition: all 0.2s;
}

.close:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

/* PRODUTO */
.produto {
  background: #f9fafb;
  padding: 10px;
  border-radius: 10px;
  font-weight: 500;
  margin-bottom: 16px;
}

/* FIELD */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

label {
  font-size: 13px;
  color: #6b7280;
}

input {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: #ff6a00;
  box-shadow: 0 0 0 3px rgba(255,106,0,0.15);
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

button {
  padding: 10px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.primary {
  background: linear-gradient(135deg, #ff7a00, #ff5a00);
  color: white;
}

.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255,106,0,0.3);
}

.secondary {
  background: #f3f4f6;
}

.secondary:hover {
  background: #e5e7eb;
}

/* ANIMAÇÃO */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
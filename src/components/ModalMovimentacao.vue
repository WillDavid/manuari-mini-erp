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
  z-index: 2000;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: var(--shadow-md);
  animation: fadeIn 0.2s ease;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header h3 {
  font-size: 22px;
  margin: 0;
  letter-spacing: -0.02em;
}

.badge {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  margin-top: 4px;
  display: inline-block;
  font-weight: 700;
}

.badge.entrada {
  background: var(--success-soft);
  color: var(--success);
}

.badge.saida {
  background: var(--danger-soft);
  color: var(--danger);
}

.close {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  width: 36px;
  height: 36px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-muted);
  transition: all 0.2s;
}

.close:hover {
  background: var(--surface-muted);
  transform: scale(1.05);
}

.produto {
  background: var(--surface-soft);
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--border);
  font-weight: 500;
  margin-bottom: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
}

input {
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

button {
  padding: 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
}

.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.3);
}

.secondary {
  background: var(--surface-soft);
  border-color: var(--border);
}

.secondary:hover {
  background: var(--surface-muted);
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

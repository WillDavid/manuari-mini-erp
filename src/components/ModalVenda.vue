<template>
  <div class="overlay" @click.self="$emit('fechar')">
    <div class="modal">

      <!-- HEADER -->
      <div class="header">
        <h2>{{ editando ? 'Editar Venda' : 'Nova Venda' }}</h2>
        <button class="close" @click="$emit('fechar')">×</button>
      </div>

      <!-- DADOS -->
      <div class="grid">
        <div class="field">
          <label>Cliente</label>
          <input v-model="venda.cliente" placeholder="Ex: João Silva" />
        </div>

        <div class="field">
          <label>Data da venda</label>
          <input type="date" v-model="venda.data_venda" />
        </div>
      </div>

      <!-- ADD PRODUTO -->
      <div class="add">
        <select v-model="produtoSelecionado">
          <option disabled value="">Selecione um produto</option>
          <option v-for="p in produtos" :key="p.id" :value="p">
            {{ p.nome }} - R$ {{ formatar(p.preco_venda) }}
          </option>
        </select>

        <button class="secondary" @click="adicionarProduto">
          + Adicionar
        </button>
      </div>

      <!-- ITENS -->
      <div class="itens">
        <div v-if="venda.itens.length === 0" class="empty">
          Nenhum produto adicionado
        </div>

        <div v-for="(item, i) in venda.itens" :key="i" class="item">
          <div class="nome">{{ item.nome }}</div>

          <input 
            type="number" 
            min="1" 
            v-model.number="item.quantidade" 
            @input="atualizar(item)" 
          />

          <div class="preco">R$ {{ formatar(item.preco) }}</div>
          <div class="subtotal">R$ {{ formatar(item.subtotal) }}</div>

          <button class="remove" @click="remover(i)">×</button>
        </div>
      </div>

      <!-- RESUMO -->
      <div class="resumo">

        <div class="linha">
          <span>Total</span>
          <strong>R$ {{ formatar(venda.total_bruto) }}</strong>
        </div>

        <div class="linha">
          <span>Desconto (%)</span>
          <div class="input-group">
            <input 
              type="number" 
              min="0" 
              max="100" 
              v-model="venda.desconto" 
              @input="recalcular" 
            />
            <span>%</span>
          </div>
        </div>

        <div class="linha total">
          <span>Total Final</span>
          <strong>R$ {{ formatar(venda.total_final) }}</strong>
        </div>

        <div class="linha">
          <span>Pagamento</span>
          <select v-model="venda.forma_pagamento" @change="onFormaPagamentoChange">
            <option value="">Selecione</option>
            <option>Pix</option>
            <option>Dinheiro</option>
            <option>Cartão</option>
            <option>Cartão de Crédito</option>
          </select>
        </div>

        <div v-if="mostrarParcelas" class="linha">
          <span>Parcelas</span>
          <select v-model="venda.parcelas">
            <option v-for="n in 12" :key="n" :value="n">{{ n }}x</option>
          </select>
        </div>

      </div>

      <!-- ACTIONS -->
      <div class="actions">
        <button class="primary" @click="submit">
          {{ editando ? 'Atualizar' : 'Finalizar Venda' }}
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
  props: ['produtos', 'editando', 'vendaInicial'],

  data() {
    return {
      produtoSelecionado: '',
      venda: this.vendaInicial || {
        cliente: '',
        data_venda: this.getHoje(),
        itens: [],
        desconto: 0,
        total_bruto: 0,
        total_final: 0,
        forma_pagamento: '',
        parcelas: 1
      }
    }
  },

  computed: {
    mostrarParcelas() {
      return this.venda.forma_pagamento === 'Cartão de Crédito'
    }
  },

  methods: {
    getHoje() {
      return new Date().toISOString().split('T')[0]
    },

    formatar(v) {
      return Number(v || 0).toFixed(2).replace('.', ',')
    },

    onFormaPagamentoChange() {
      if (!this.mostrarParcelas) {
        this.venda.parcelas = 1
      }
    },

    adicionarProduto() {
      if (!this.produtoSelecionado) return

      const existente = this.venda.itens.find(
        i => i.produto_id === this.produtoSelecionado.id
      )

      if (existente) {
        existente.quantidade++
        this.atualizar(existente)
      } else {
        this.venda.itens.push({
          produto_id: this.produtoSelecionado.id,
          nome: this.produtoSelecionado.nome,
          preco: this.produtoSelecionado.preco_venda,
          quantidade: 1,
          subtotal: this.produtoSelecionado.preco_venda
        })
      }

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
      const valorDesconto = this.venda.total_bruto * (desconto / 100)

      this.venda.total_final = Math.max(
        this.venda.total_bruto - valorDesconto,
        0
      )
    },

    submit() {
      if (this.venda.itens.length === 0) {
        alert('Adicione produtos')
        return
      }

      this.$emit('salvar', this.venda)
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
  max-width: 720px;
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: var(--shadow-md);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.close {
  font-size: 20px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: 12px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
}

input, select {
  background: var(--surface);
  font-size: 14px;
}

.add {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.add select {
  flex: 1;
}

.itens {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: grid;
  grid-template-columns: 1fr 70px 90px 90px 40px;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  align-items: center;
}

.item input {
  text-align: center;
}

.preco {
  color: var(--text-muted);
}

.subtotal {
  font-weight: 600;
}

.empty {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
}

.resumo {
  margin-top: 20px;
  background: var(--surface-soft);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.total {
  font-size: 16px;
  font-weight: 600;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-group input {
  width: 80px;
  text-align: center;
}

button {
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 12px;
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
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
}

.secondary {
  background: var(--surface-soft);
  border-color: var(--border);
}

.secondary:hover {
  background: var(--surface-muted);
}

.remove {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: #fecaca;
}

.remove:hover {
  background: #fee2e2;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .add {
    flex-direction: column;
  }

  .item {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }
}
</style>

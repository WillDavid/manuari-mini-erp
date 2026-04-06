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
          <select v-model="venda.forma_pagamento">
            <option value="">Selecione</option>
            <option>Pix</option>
            <option>Dinheiro</option>
            <option>Cartão</option>
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
        forma_pagamento: ''
      }
    }
  },

  methods: {
    getHoje() {
      return new Date().toISOString().split('T')[0]
    },

    formatar(v) {
      return Number(v || 0).toFixed(2).replace('.', ',')
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
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 720px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  font-size: 20px;
  font-weight: 600;
}

.close {
  font-size: 20px;
  background: #f3f4f6;
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* FIELD */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  color: #6b7280;
}

/* INPUTS */
input, select {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: #ff6a00;
  box-shadow: 0 0 0 3px rgba(255,106,0,0.15);
}

/* ADD */
.add {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.add select {
  flex: 1;
}

/* ITENS */
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
  background: #fafafa;
  border: 1px solid #eee;
  align-items: center;
}

.item input {
  text-align: center;
}

.preco {
  color: #6b7280;
}

.subtotal {
  font-weight: 600;
}

/* EMPTY */
.empty {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}

/* RESUMO */
.resumo {
  margin-top: 20px;
  background: #f9fafb;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #eee;
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

/* INPUT GROUP */
.input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-group input {
  width: 80px;
  text-align: center;
}

/* BOTÕES */
button {
  border: none;
  border-radius: 10px;
  padding: 12px;
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
  box-shadow: 0 8px 20px rgba(255,106,0,0.3);
}

.secondary {
  background: #f3f4f6;
}

.secondary:hover {
  background: #e5e7eb;
}

.remove {
  background: #ffe4e4;
}

.remove:hover {
  background: #ffc9c9;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

/* RESPONSIVO */
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
<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Estoque</h3>
    </div>

    <!-- TABELA -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Código</th>
            <th>Estoque</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in produtos" :key="p.id">

            <td data-label="Nome">{{ p.nome }}</td>

            <td data-label="Código">{{ p.codigo }}</td>

            <td data-label="Estoque">{{ p.estoque }}</td>

            <td data-label="Status">
              <span :class="statusClasse(p.estoque)">
                {{ statusTexto(p.estoque) }}
              </span>
            </td>

            <td data-label="Ações" class="actions">
              <button class="entrada" @click="abrirMovimentacao(p, 'entrada')">
                Entrada
              </button>

              <button class="saida" @click="abrirMovimentacao(p, 'saida')">
                Saída
              </button>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL -->
    <ModalMovimentacao
      v-if="modalAberto"
      :produto="produtoSelecionado"
      :tipo="tipoMovimentacao"
      @fechar="fecharModal"
      @salvar="salvarMovimentacao"
    />

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import ModalMovimentacao from '../components/ModalMovimentacao.vue'

export default {
  components: { ModalMovimentacao },

  data() {
    return {
      produtos: [],
      modalAberto: false,
      produtoSelecionado: null,
      tipoMovimentacao: 'entrada'
    }
  },

  mounted() {
    this.buscarProdutos()
  },

  methods: {

    async buscarProdutos() {
      const { data } = await supabase
        .from('produtos_erp')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      this.produtos = data || []
    },

    abrirMovimentacao(produto, tipo) {
      this.produtoSelecionado = produto
      this.tipoMovimentacao = tipo
      this.modalAberto = true
    },

    fecharModal() {
      this.modalAberto = false
      this.produtoSelecionado = null
    },

    async salvarMovimentacao({ quantidade, observacao }) {
      const produto = this.produtoSelecionado

      let novoEstoque =
        this.tipoMovimentacao === 'entrada'
          ? produto.estoque + quantidade
          : produto.estoque - quantidade

      if (novoEstoque < 0) {
        alert('Estoque não pode ficar negativo')
        return
      }

      // atualizar estoque
      await supabase
        .from('produtos_erp')
        .update({ estoque: novoEstoque })
        .eq('id', produto.id)

      // registrar movimentação
      await supabase
        .from('estoque_movimentacoes')
        .insert([{
          produto_id: produto.id,
          tipo: this.tipoMovimentacao,
          quantidade,
          observacao
        }])

      this.fecharModal()
      this.buscarProdutos()
    },

    statusTexto(qtd) {
      if (qtd === 0) return 'Zerado'
      if (qtd <= 5) return 'Baixo'
      return 'OK'
    },

    statusClasse(qtd) {
      if (qtd === 0) return 'zerado'
      if (qtd <= 5) return 'baixo'
      return 'ok'
    }

  }
}
</script>

<style scoped>
.page {
  padding: 24px;
}

.header {
  margin-bottom: 16px;
}

.table-card {
  background: white;
  border-radius: 10px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f1f1f1;
  padding: 12px;
  text-align: left;
}

td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

/* BOTÕES */
button {
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.entrada {
  background: #2e7d32;
  color: white;
  margin-right: 6px;
}

.saida {
  background: #d32f2f;
  color: white;
}

/* STATUS */
.ok {
  color: #2e7d32;
}

.baixo {
  color: #f9a825;
}

.zerado {
  color: #c62828;
}

.actions {
  display: flex;
}

/* MOBILE */
@media (max-width: 768px) {

  table, thead, tbody, th, td, tr {
    display: block;
  }

  thead {
    display: none;
  }

  tr {
    background: white;
    margin-bottom: 12px;
    border-radius: 8px;
    padding: 10px;
  }

  td {
    display: flex;
    justify-content: space-between;
    padding: 8px 6px;
    border: none;
  }

  td::before {
    content: attr(data-label);
    font-weight: bold;
  }

  .actions {
    justify-content: flex-end;
    gap: 6px;
  }
}
</style>
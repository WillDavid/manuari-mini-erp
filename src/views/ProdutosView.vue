<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Produtos</h3>
      <button class="primary" @click="abrirNovo">
        Novo Produto
      </button>
    </div>

    <!-- TABELA -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Código</th>
            <th>Preço Custo</th>
            <th>Preço Venda</th>
            <th>Estoque</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
            <tr v-for="p in produtos" :key="p.id">
                <td data-label="Nome">{{ p.nome }}</td>
                <td data-label="Código">{{ p.codigo }}</td>
                <td data-label="Preço Custo">R$ {{ formatarPreco(p.preco_custo) }}</td>
                <td data-label="Preço Venda">R$ {{ formatarPreco(p.preco_venda) }}</td>
                <td data-label="Estoque">{{ p.estoque }}</td>
                <td data-label="Status">
                <span :class="p.ativo ? 'ativo' : 'inativo'">
                    {{ p.ativo ? 'Ativo' : 'Inativo' }}
                </span>
                </td>
                <td data-label="Ações" class="actions">
                <button class="edit" @click="editarProduto(p)">Editar</button>
                <button class="delete" @click="deletarProduto(p.id)">Excluir</button>
                </td>
            </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL COMPONENTE -->
    <ModalProduto
      v-if="modalAberto"
      :produto="produto"
      :editando="editando"
      @fechar="fecharModal"
      @salvar="salvarProduto"
    />

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import ModalProduto from '../components/ModalProduto.vue'

export default {
  components: {
    ModalProduto
  },

  data() {
    return {
      produtos: [],
      modalAberto: false,
      editando: false,
      produtoId: null,

      produto: {
        nome: '',
        codigo: '',
        preco_custo: 0,
        preco_venda: 0,
        estoque: 0,
        ativo: true
      }
    }
  },

  mounted() {
    this.buscarProdutos()
  },

  methods: {
    async buscarProdutos() {
      const { data, error } = await supabase
        .from('produtos_erp')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error) {
        this.produtos = data
      }
    },

    abrirNovo() {
      this.resetForm()
      this.modalAberto = true
    },

    editarProduto(p) {
      this.produto = {
        ...p,
        preco_custo: this.formatarInput(p.preco_custo),
        preco_venda: this.formatarInput(p.preco_venda)
      }

      this.produtoId = p.id
      this.editando = true
      this.modalAberto = true
    },

    fecharModal() {
      this.modalAberto = false
      this.resetForm()
    },

    async salvarProduto(produto) {
      if (produto.preco_venda <= 0) {
        alert('Preço inválido')
        return
      }

      if (this.editando) {
        await supabase
          .from('produtos_erp')
          .update(produto)
          .eq('id', this.produtoId)
      } else {
        await supabase
          .from('produtos_erp')
          .insert([produto])
      }

      this.fecharModal()
      this.buscarProdutos()
    },

    async deletarProduto(id) {
      if (!confirm('Excluir produto?')) return

      await supabase
        .from('produtos_erp')
        .delete()
        .eq('id', id)

      this.buscarProdutos()
    },

    resetForm() {
      this.editando = false
      this.produtoId = null

      this.produto = {
        nome: '',
        codigo: '',
        preco_custo: 0,
        preco_venda: 0,
        estoque: 0,
        ativo: true
      }
    },

    formatarPreco(valor) {
      if (!valor) return '0,00'
      return Number(valor).toFixed(2).replace('.', ',')
    },

    formatarInput(valor) {
      if (!valor) return ''
      return Number(valor).toString().replace('.', ',')
    }
  }
}
</script>

<style scoped>
.page {
  padding: 24px;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* TABELA */
.table-card {
  background: white;
  border-radius: 10px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th {
  background: #f1f1f1;
  text-align: left;
  padding: 12px;
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

.primary {
  background: #ff6a00;
  color: white;
}

.edit {
  background: #1976d2;
  color: white;
  margin-right: 6px;
}

.delete {
  background: #d32f2f;
  color: white;
}

/* STATUS */
.ativo {
  color: #2e7d32;
}

.inativo {
  color: #c62828;
}

.actions {
  display: flex;
}

/* MOBILE */
@media (max-width: 768px) {

  table,
  thead,
  tbody,
  th,
  td,
  tr {
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
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }

  td {
    display: flex;
    justify-content: space-between;
    padding: 8px 6px;
    border: none;
    font-size: 13px;
  }

  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #666;
  }

  .actions {
    justify-content: flex-end;
    gap: 6px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .primary {
    width: 100%;
  }
}
</style>
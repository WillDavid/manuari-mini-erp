<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Produtos</h3>
      <button class="primary" @click="abrirNovo">
        Novo Produto
      </button>
    </div>

    <div class="filtros">
      <input
        v-model="busca"
        placeholder="Buscar por nome, codigo, preco, estoque ou status..."
        class="input busca"
      />
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
            <tr v-for="p in produtosPaginados" :key="p.id">
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
                <td class="actions-cell">
                  <div class="actions-wrap">
                    <button class="edit" @click="editarProduto(p)">Editar</button>
                    <button class="delete" @click="deletarProduto(p.id)">Excluir</button>
                  </div>
                </td>
            </tr>
        </tbody>
      </table>
    </div>

    <div v-if="produtosFiltrados.length" class="pagination">
      <div class="pagination-meta">
        <label class="pagination-select">
          <span>Mostrar</span>
          <select v-model.number="itensPorPagina">
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>

        <span class="pagination-info">
          {{ produtosFiltrados.length }} resultado(s) • Pagina {{ paginaAtual }} de {{ totalPaginas }}
        </span>
      </div>

      <div class="pagination-actions">
        <button :disabled="paginaAtual === 1" @click="irParaPagina(paginaAtual - 1)">
          Anterior
        </button>
        <button :disabled="paginaAtual === totalPaginas" @click="irParaPagina(paginaAtual + 1)">
          Proxima
        </button>
      </div>
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
      busca: '',
      paginaAtual: 1,
      itensPorPagina: 20,
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
        this.ajustarPagina()
        this.notificarEstoqueAtualizado()
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
    },

    irParaPagina(pagina) {
      this.paginaAtual = pagina
    },

    ajustarPagina() {
      if (this.paginaAtual > this.totalPaginas) {
        this.paginaAtual = this.totalPaginas
      }
    },

    notificarEstoqueAtualizado() {
      window.dispatchEvent(new Event('estoque-atualizado'))
    }
  },

  computed: {
    totalPaginas() {
      return Math.max(1, Math.ceil(this.produtosFiltrados.length / this.itensPorPagina))
    },

    produtosFiltrados() {
      const termo = this.busca.trim().toLowerCase()

      if (!termo) return this.produtos

      return this.produtos.filter((produto) => {
        const conteudo = [
          produto.nome,
          produto.codigo,
          produto.preco_custo,
          produto.preco_venda,
          produto.estoque,
          produto.ativo ? 'ativo' : 'inativo',
        ]
          .filter((valor) => valor !== null && valor !== undefined)
          .join(' ')
          .toLowerCase()

        return conteudo.includes(termo)
      })
    },

    produtosPaginados() {
      const inicio = (this.paginaAtual - 1) * this.itensPorPagina
      return this.produtosFiltrados.slice(inicio, inicio + this.itensPorPagina)
    }
  },

  watch: {
    produtos() {
      this.ajustarPagina()
    },

    busca() {
      this.paginaAtual = 1
    },

    itensPorPagina() {
      this.paginaAtual = 1
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px 20px 32px;
  max-width: 1520px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.header h3 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 0;
}

.filtros {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.busca {
  width: 100%;
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin-bottom: 18px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

thead th {
  background: #F1F5F9;
  text-align: left;
  padding: 8px 14px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  position: sticky;
  top: 0;
}

tbody tr {
  height: 42px;
}

tbody tr:nth-child(even) {
  background: rgba(241, 245, 249, 0.6);
}

tbody tr:hover {
  background: rgba(232, 110, 26, 0.04);
}

tbody tr:last-child td {
  border-bottom: none;
}

td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

button {
  border: 1px solid transparent;
  padding: 9px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: white;
}

.edit {
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--info);
  margin-right: 0;
}

.edit:hover {
  background: #dbeafe;
}

.delete {
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--danger);
}

.delete:hover {
  background: #fee2e2;
}

.ativo,
.inativo {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.ativo {
  color: var(--success);
  background: var(--success-soft);
}

.inativo {
  color: var(--danger);
  background: var(--danger-soft);
}

.actions {
  display: flex;
  gap: 6px;
}

.actions-cell {
  width: 1%;
  white-space: nowrap;
  text-align: center;
  vertical-align: middle;
}

.actions-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  line-height: 1;
}

.actions-wrap button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.pagination-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.pagination-select {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.pagination-select select {
  width: auto;
  min-width: 86px;
}

.pagination-info {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.pagination-actions {
  display: flex;
  gap: 8px;
}

.pagination-actions button {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}

.pagination-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page { padding: 16px 12px 24px; }
  .header { flex-direction: column; align-items: stretch; }
  .header h3 { font-size: 20px; }
  .primary { width: 100%; }
  table, thead, tbody, th, td, tr { display: block; }
  thead { display: none; }
  tr {
    background: var(--surface);
    margin-bottom: 10px;
    border-radius: var(--radius-md);
    padding: 12px;
    border: 1px solid var(--border);
  }
  td {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 4px;
    border: none;
    font-size: 13px;
  }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-muted);
    font-size: 11px;
  }
  .actions-wrap { justify-content: flex-end; flex-wrap: wrap; }
  .pagination { flex-direction: column; align-items: stretch; gap: 10px; }
  .pagination-meta { flex-direction: column; align-items: stretch; gap: 10px; }
  .pagination-select { justify-content: space-between; }
  .pagination-select select { width: 100%; height: 36px; }
  .pagination-actions { width: 100%; }
  .pagination-actions button { flex: 1; height: 32px; }
  .pagination-actions button:disabled { opacity: 0.4; cursor: not-allowed; }
}
</style>

<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Estoque</h3>
    </div>

    <div class="filtros">
      <input
        v-model="busca"
        placeholder="Buscar por nome, codigo, estoque ou status..."
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
            <th>Estoque</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in produtosPaginados" :key="p.id">

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

    <div v-if="produtosFiltrados.length" class="pagination">
      <div class="pagination-meta">
        <label class="pagination-select">
          <span>Mostrar</span>
          <select v-model.number="itensPorPagina">
            <option :value="100">100</option>
            <option :value="200">200</option>
            <option :value="500">500</option>
            <option :value="1000">1000</option>
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
      busca: '',
      paginaAtual: 1,
      itensPorPagina: 10,
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
      this.ajustarPagina()
      this.notificarEstoqueAtualizado()
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
      if (qtd <= 3) return 'Baixo'
      return 'OK'
    },

    statusClasse(qtd) {
      if (qtd === 0) return 'zerado'
      if (qtd <= 3) return 'baixo'
      return 'ok'
    },

    notificarEstoqueAtualizado() {
      window.dispatchEvent(new Event('estoque-atualizado'))
    },

    irParaPagina(pagina) {
      this.paginaAtual = pagina
    },

    ajustarPagina() {
      if (this.paginaAtual > this.totalPaginas) {
        this.paginaAtual = this.totalPaginas
      }
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
          produto.estoque,
          this.statusTexto(produto.estoque),
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
  padding: 32px 20px 40px;
  max-width: 1520px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.header h3 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.filtros {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.busca {
  width: 100%;
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  box-shadow: var(--shadow-sm);
  margin-bottom: 18px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: var(--surface-soft);
  padding: 14px 16px;
  text-align: left;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

button {
  border: 1px solid transparent;
  padding: 9px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.entrada {
  background: var(--success-soft);
  color: var(--success);
  border-color: #bbf7d0;
}

.saida {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: #fecaca;
}

.entrada:hover {
  background: #dcfce7;
}

.saida:hover {
  background: #fee2e2;
}

.ok {
  color: var(--success);
  background: var(--success-soft);
}

.baixo {
  color: var(--warning);
  background: var(--warning-soft);
}

.zerado {
  color: var(--danger);
  background: var(--danger-soft);
}

.ok,
.baixo,
.zerado {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
  font-size: 13px;
  font-weight: 600;
}

.pagination-select select {
  width: auto;
  min-width: 86px;
}

.pagination-info {
  color: var(--text-muted);
  font-size: 13px;
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

tbody tr:hover {
  background: rgba(248, 250, 252, 0.9);
}

tbody tr:last-child td {
  border-bottom: none;
}

@media (max-width: 768px) {
  .page {
    padding: 24px 12px 32px;
  }

  .header h3 {
    font-size: 24px;
  }

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
    background: var(--surface);
    margin-bottom: 12px;
    border-radius: 18px;
    padding: 12px;
    border: 1px solid var(--border);
  }

  td {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 4px;
    border: none;
  }

  td::before {
    content: attr(data-label);
    font-weight: 700;
    color: var(--text-muted);
  }

  .actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-meta {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-select {
    justify-content: space-between;
  }

  .pagination-select select {
    width: 100%;
  }

  .pagination-actions {
    width: 100%;
  }

  .pagination-actions button {
    flex: 1;
  }
}
</style>

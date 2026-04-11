<template>
  <div class="page">

    <!-- BANNER EM CONSTRUCAO -->
    <div class="construction-banner">
      <span class="badge">Em construcao</span>
      <p>Esta area esta em desenvolvimento. Funcionalidades serao adicionadas em breve.</p>
    </div>

    <!-- HEADER -->
    <div class="header">
      <h3>Financeiro</h3>
      <button class="primary" @click="abrirNovaMovimentacao">
        Nova Movimentacao
      </button>
    </div>

    <!-- RESUMO -->
    <div class="resumo-cards">
      <div class="card resumo">
        <span class="label">Saldo Atual</span>
        <span class="valor" :class="saldoGeral >= 0 ? 'positivo' : 'negativo'">
          R$ {{ formatarPreco(saldoGeral) }}
        </span>
      </div>

      <div class="card entrada">
        <span class="label">Entradas</span>
        <span class="valor positivo">R$ {{ formatarPreco(totalEntradas) }}</span>
      </div>

      <div class="card saida">
        <span class="label">Saídas</span>
        <span class="valor negativo">R$ {{ formatarPreco(totalSaidas) }}</span>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="filtros">
      <input
        v-model="busca"
        placeholder="Buscar por descricao..."
        class="input busca"
      />

      <select v-model="filtroTipo" class="input">
        <option value="">Todos os tipos</option>
        <option value="entrada">Entrada</option>
        <option value="saida">Saída</option>
      </select>
    </div>

    <!-- TABELA -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Descricao</th>
            <th>Valor</th>
            <th>Forma Pagamento</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="m in movimentacoesPaginadas" :key="m.id">
            <td data-label="Data">{{ formatarData(m.data) }}</td>

            <td data-label="Tipo">
              <span :class="m.tipo === 'entrada' ? 'tipo-entrada' : 'tipo-saida'">
                {{ m.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
              </span>
            </td>

            <td data-label="Descricao">{{ m.descricao }}</td>

            <td data-label="Valor" :class="m.tipo === 'entrada' ? 'positivo' : 'negativo'">
              {{ m.tipo === 'entrada' ? '+' : '-' }}R$ {{ formatarPreco(m.valor) }}
            </td>

            <td data-label="Forma Pagamento">{{ m.forma_pagamento }}</td>

            <td data-label="Ações" class="actions">
              <button class="edit" @click="editarMovimentacao(m)">Editar</button>
              <button class="delete" @click="deletarMovimentacao(m.id)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="movimentacoesFiltradas.length" class="pagination">
      <div class="pagination-meta">
        <label class="pagination-select">
          <span>Mostrar</span>
          <select v-model.number="itensPorPagina">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>

        <span class="pagination-info">
          {{ movimentacoesFiltradas.length }} resultado(s) • Pagina {{ paginaAtual }} de {{ totalPaginas }}
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
    <ModalMovimentacaoFinanceira
      v-if="modalAberto"
      :movimentacao="movimentacao"
      :editando="editando"
      @fechar="fecharModal"
      @salvar="salvarMovimentacao"
    />

  </div>
</template>

<script>
import ModalMovimentacaoFinanceira from '../components/ModalMovimentacaoFinanceira.vue'

export default {
  components: {
    ModalMovimentacaoFinanceira
  },

  data() {
    return {
      movimentacoes: [
        { id: 1, tipo: 'entrada', descricao: 'Venda #101', valor: 150.00, forma_pagamento: 'Pix', data: '2026-04-10' },
        { id: 2, tipo: 'entrada', descricao: 'Venda #102', valor: 89.90, forma_pagamento: 'Dinheiro', data: '2026-04-10' },
        { id: 3, tipo: 'saida', descricao: 'Reposicao estoque - Fornecedor XYZ', valor: 320.00, forma_pagamento: 'Transferencia', data: '2026-04-09' },
        { id: 4, tipo: 'entrada', descricao: 'Venda #103', valor: 259.90, forma_pagamento: 'Cartao', data: '2026-04-09' },
        { id: 5, tipo: 'saida', descricao: 'Frete entrega', valor: 45.00, forma_pagamento: 'Dinheiro', data: '2026-04-08' },
        { id: 6, tipo: 'entrada', descricao: 'Venda #104', valor: 75.00, forma_pagamento: 'Pix', data: '2026-04-08' },
        { id: 7, tipo: 'saida', descricao: 'Material de embalacao', valor: 120.00, forma_pagamento: 'Transferencia', data: '2026-04-07' },
        { id: 8, tipo: 'entrada', descricao: 'Venda #105', valor: 189.90, forma_pagamento: 'Cartao', data: '2026-04-07' },
        { id: 9, tipo: 'saida', descricao: 'Conta de luz', valor: 280.00, forma_pagamento: 'Transferencia', data: '2026-04-06' },
        { id: 10, tipo: 'entrada', descricao: 'Venda #106', valor: 99.90, forma_pagamento: 'Dinheiro', data: '2026-04-06' },
        { id: 11, tipo: 'saida', descricao: 'Tarifas banco', valor: 29.90, forma_pagamento: 'Debito automatico', data: '2026-04-05' },
        { id: 12, tipo: 'entrada', descricao: 'Venda #107', valor: 349.90, forma_pagamento: 'Pix', data: '2026-04-05' }
      ],

      busca: '',
      filtroTipo: '',
      paginaAtual: 1,
      itensPorPagina: 10,
      modalAberto: false,
      editando: false,
      movimentacaoId: null,

      movimentacao: {
        tipo: 'entrada',
        descricao: '',
        valor: 0,
        forma_pagamento: '',
        data: ''
      }
    }
  },

  computed: {
    totalEntradas() {
      return this.movimentacoes
        .filter(m => m.tipo === 'entrada')
        .reduce((acc, m) => acc + m.valor, 0)
    },

    totalSaidas() {
      return this.movimentacoes
        .filter(m => m.tipo === 'saida')
        .reduce((acc, m) => acc + m.valor, 0)
    },

    saldoGeral() {
      return this.totalEntradas - this.totalSaidas
    },

    totalPaginas() {
      return Math.max(1, Math.ceil(this.movimentacoesFiltradas.length / this.itensPorPagina))
    },

    movimentacoesFiltradas() {
      let lista = [...this.movimentacoes]

      if (this.busca) {
        const termo = this.busca.toLowerCase()
        lista = lista.filter(m =>
          m.descricao.toLowerCase().includes(termo)
        )
      }

      if (this.filtroTipo) {
        lista = lista.filter(m => m.tipo === this.filtroTipo)
      }

      return lista.sort((a, b) => new Date(b.data) - new Date(a.data))
    },

    movimentacoesPaginadas() {
      const inicio = (this.paginaAtual - 1) * this.itensPorPagina
      return this.movimentacoesFiltradas.slice(inicio, inicio + this.itensPorPagina)
    }
  },

  watch: {
    busca() {
      this.paginaAtual = 1
    },

    filtroTipo() {
      this.paginaAtual = 1
    },

    itensPorPagina() {
      this.paginaAtual = 1
    },

    movimentacoes() {
      this.ajustarPagina()
    }
  },

  methods: {
    abrirNovaMovimentacao() {
      this.resetForm()
      this.modalAberto = true
    },

    editarMovimentacao(m) {
      this.movimentacao = { ...m }
      this.movimentacaoId = m.id
      this.editando = true
      this.modalAberto = true
    },

    fecharModal() {
      this.modalAberto = false
      this.resetForm()
    },

    salvarMovimentacao(mov) {
      if (this.editando) {
        const index = this.movimentacoes.findIndex(m => m.id === this.movimentacaoId)
        if (index !== -1) {
          this.movimentacoes[index] = { ...mov, id: this.movimentacaoId }
        }
      } else {
        const novoId = Math.max(...this.movimentacoes.map(m => m.id), 0) + 1
        this.movimentacoes.push({ ...mov, id: novoId })
      }

      this.fecharModal()
    },

    deletarMovimentacao(id) {
      if (!confirm('Excluir movimentacao?')) return

      this.movimentacoes = this.movimentacoes.filter(m => m.id !== id)
    },

    resetForm() {
      this.editando = false
      this.movimentacaoId = null
      this.movimentacao = {
        tipo: 'entrada',
        descricao: '',
        valor: 0,
        forma_pagamento: '',
        data: ''
      }
    },

    formatarPreco(valor) {
      if (!valor) return '0,00'
      return Number(valor).toFixed(2).replace('.', ',')
    },

    formatarData(data) {
      if (!data) return '-'
      return data.split('-').reverse().join('/')
    },

    irParaPagina(pagina) {
      this.paginaAtual = pagina
    },

    ajustarPagina() {
      if (this.paginaAtual > this.totalPaginas) {
        this.paginaAtual = this.totalPaginas
      }
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

.construction-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.04));
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.construction-banner .badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-hover);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.construction-banner p {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.header h3 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.resumo-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card.resumo {
  background: var(--surface-soft);
}

.card .label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.card .valor {
  font-size: 24px;
  font-weight: 700;
}

.card .valor.positivo {
  color: var(--success);
}

.card .valor.negativo {
  color: var(--danger);
}

.filtros {
  display: grid;
  grid-template-columns: 1fr 200px;
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
  font-size: 14px;
}

th {
  background: var(--surface-soft);
  text-align: left;
  padding: 14px 16px;
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

.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.22);
}

.edit {
  background: #eff6ff;
  color: var(--info);
  border-color: #bfdbfe;
}

.delete {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: #fecaca;
}

.edit:hover {
  background: #dbeafe;
}

.delete:hover {
  background: #fee2e2;
}

.primary:hover {
  transform: translateY(-1px);
}

.actions {
  display: flex;
  gap: 8px;
}

tbody tr:hover {
  background: rgba(248, 250, 252, 0.9);
}

tbody tr:last-child td {
  border-bottom: none;
}

.tipo-entrada {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--success-soft);
  color: var(--success);
  font-size: 12px;
  font-weight: 600;
}

.tipo-saida {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 12px;
  font-weight: 600;
}

.positivo {
  color: var(--success);
  font-weight: 600;
}

.negativo {
  color: var(--danger);
  font-weight: 600;
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

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .header h3 {
    font-size: 24px;
  }

  .primary {
    width: 100%;
  }

  .resumo-cards {
    flex-direction: column;
  }

  .filtros {
    grid-template-columns: 1fr;
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
    box-shadow: none;
  }

  td {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 4px;
    border: none;
    font-size: 13px;
  }

  td::before {
    content: attr(data-label);
    font-weight: 700;
    color: var(--text-muted);
  }

  .actions {
    justify-content: flex-end;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-meta {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-actions {
    width: 100%;
  }

  .pagination-actions button {
    flex: 1;
  }
}
</style>
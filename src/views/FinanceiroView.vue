<template>
  <div class="page">

    <!-- BANNER -->
    <div class="construction-banner">
      <span class="badge">Novo</span>
      <p>Financeiro integrado com vendas. Use as abas para gerenciar.</p>
    </div>

    <!-- HEADER -->
    <div class="header">
      <h3>Financeiro</h3>
      <button class="primary" @click="abrirNovaConta">
        Nova Conta
      </button>
    </div>

    <!-- ABAS -->
    <div class="tabs">
      <button
        :class="['tab', abaAtiva === 'resumo' ? 'active' : '']"
        @click="abaAtiva = 'resumo'"
      >
        Resumo
      </button>
      <button
        :class="['tab', abaAtiva === 'receber' ? 'active' : '']"
        @click="abaAtiva = 'receber'"
      >
        Receber
        <span v-if="contasReceberPendentes > 0" class="tab-badge">{{ contasReceberPendentes }}</span>
      </button>
      <button
        :class="['tab', abaAtiva === 'pagar' ? 'active' : '']"
        @click="abaAtiva = 'pagar'"
      >
        Pagar
        <span v-if="contasPagarPendentes > 0" class="tab-badge warning">{{ contasPagarPendentes }}</span>
      </button>
    </div>

    <!-- RESUMO / FLUXO DE CAIXA -->
    <div v-if="abaAtiva === 'resumo'" class="aba-content">

      <!-- RESUMO FINANCEIRO -->
      <div class="resumo-cards">
        <div class="card resumo">
          <span class="label">Saldo Atual</span>
          <span class="valor" :class="fluxo.saldoAtual >= 0 ? 'positivo' : 'negativo'">
            R$ {{ formatarPreco(fluxo.saldoAtual) }}
          </span>
        </div>

        <div class="card entrada">
          <span class="label">Recebido</span>
          <span class="valor positivo">R$ {{ formatarPreco(fluxo.entradas) }}</span>
        </div>

        <div class="card saida">
          <span class="label">Pago</span>
          <span class="valor negativo">R$ {{ formatarPreco(fluxo.saidas) }}</span>
        </div>
      </div>

      <div class="resumo-cards secondary">
        <div class="card">
          <span class="label">A Receber</span>
          <span class="valor pendente">R$ {{ formatarPreco(fluxo.pendentesReceber) }}</span>
        </div>

        <div class="card">
          <span class="label">A Pagar</span>
          <span class="valor pendente">R$ {{ formatarPreco(fluxo.pendentesPagar) }}</span>
        </div>

        <div class="card projecao">
          <span class="label">Saldo Projetado</span>
          <span class="valor" :class="fluxo.saldoProjetado >= 0 ? 'positivo' : 'negativo'">
            R$ {{ formatarPreco(fluxo.saldoProjetado) }}
          </span>
        </div>
      </div>

    </div>

    <!-- CONTAS A RECEBER -->
    <div v-if="abaAtiva === 'receber'" class="aba-content">

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Venda</th>
              <th>Parcela</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="conta in contasReceberPaginadas" :key="conta.id">
              <td data-label="Venda">#{{ conta.venda_id?.slice(0, 8) }}</td>
              <td data-label="Parcela">{{ conta.numero_parcela }}/{{ conta.total_parcelas }}</td>
              <td data-label="Valor" :class="conta.status === 'recebido' ? 'positivo' : ''">
                R$ {{ formatarPreco(conta.valor) }}
              </td>
              <td data-label="Vencimento">{{ formatarData(conta.data_vencimento) }}</td>
              <td data-label="Status">
                <span :class="['status-badge', conta.status]">
                  {{ conta.status === 'recebido' ? 'Recebido' : 'Pendente' }}
                </span>
              </td>
              <td data-label="Ações" class="actions">
                <button
                  v-if="conta.status === 'pendente'"
                  class="confirm"
                  @click="marcarRecebido(conta.id)"
                >
                  Receber
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="contasReceberFiltradas.length" class="pagination">
        <div class="pagination-info">
          {{ contasReceberFiltradas.length }} conta(s) • Pagina {{ paginaReceber }} de {{ totalPaginasReceber }}
        </div>
        <div class="pagination-actions">
          <button :disabled="paginaReceber === 1" @click="paginaReceber--">Anterior</button>
          <button :disabled="paginaReceber === totalPaginasReceber" @click="paginaReceber++">Proxima</button>
        </div>
      </div>

    </div>

    <!-- CONTAS A PAGAR -->
    <div v-if="abaAtiva === 'pagar'" class="aba-content">

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Descricao</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="conta in contasPagarPaginadas" :key="conta.id">
              <td data-label="Descricao">{{ conta.descricao }}</td>
              <td data-label="Valor" :class="conta.status === 'pago' ? 'positivo' : 'negativo'">
                R$ {{ formatarPreco(conta.valor) }}
              </td>
              <td data-label="Vencimento">{{ formatarData(conta.data_vencimento) }}</td>
              <td data-label="Status">
                <span :class="['status-badge', conta.status]">
                  {{ conta.status === 'pago' ? 'Pago' : 'Pendente' }}
                </span>
              </td>
              <td data-label="Ações" class="actions">
                <button
                  v-if="conta.status === 'pendente'"
                  class="confirm"
                  @click="marcarPago(conta.id)"
                >
                  Pagar
                </button>
                <button class="delete" @click="deletarContaPagar(conta.id)">
                  Excluir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="contasPagarFiltradas.length" class="pagination">
        <div class="pagination-info">
          {{ contasPagarFiltradas.length }} conta(s) • Pagina {{ paginaPagar }} de {{ totalPaginasPagar }}
        </div>
        <div class="pagination-actions">
          <button :disabled="paginaPagar === 1" @click="paginaPagar--">Anterior</button>
          <button :disabled="paginaPagar === totalPaginasPagar" @click="paginaPagar++">Proxima</button>
        </div>
      </div>

    </div>

    <!-- MODAL -->
    <ModalContaPagar
      v-if="modalAberto"
      :conta="contaEdicao"
      :editando="editando"
      @fechar="fecharModal"
      @salvar="salvarConta"
    />

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import {
  buscarContasReceber,
  buscarContasPagar,
  atualizarStatusContaReceber,
  atualizarStatusContaPagar,
  criarContaPagar,
  deletarContaReceber,
  calcularFluxoCaixa,
  STATUS_RECEBIDO,
  STATUS_PENDENTE
} from '../services/financeiro'
import ModalContaPagar from '../components/ModalContaPagar.vue'

const ITENS_POR_PAGINA = 10

export default {
  components: { ModalContaPagar },

  data() {
    return {
      contasReceber: [],
      contasPagar: [],

      abaAtiva: 'resumo',
      paginaReceber: 1,
      paginaPagar: 1,

      modalAberto: false,
      editando: false,
      contaEdicao: null,

      contaEdicao: {
        descricao: '',
        valor: 0,
        data_vencimento: '',
        forma_pagamento: ''
      }
    }
  },

  async mounted() {
    await this.buscarContas()
  },

  computed: {
    contasReceberPendentes() {
      return this.contasReceber.filter(c => c.status === STATUS_PENDENTE).length
    },

    contasPagarPendentes() {
      return this.contasPagar.filter(c => c.status === STATUS_PENDENTE).length
    },

    contasReceberFiltradas() {
      return [...this.contasReceber].sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
    },

    contasPagarFiltradas() {
      return [...this.contasPagar].sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
    },

    totalPaginasReceber() {
      return Math.max(1, Math.ceil(this.contasReceberFiltradas.length / ITENS_POR_PAGINA))
    },

    totalPaginasPagar() {
      return Math.max(1, Math.ceil(this.contasPagarFiltradas.length / ITENS_POR_PAGINA))
    },

    contasReceberPaginadas() {
      const inicio = (this.paginaReceber - 1) * ITENS_POR_PAGINA
      return this.contasReceberFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA)
    },

    contasPagarPaginadas() {
      const inicio = (this.paginaPagar - 1) * ITENS_POR_PAGINA
      return this.contasPagarFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA)
    },

    fluxo() {
      return calcularFluxoCaixa(this.contasReceber, this.contasPagar)
    }
  },

  methods: {
    async buscarContas() {
      this.contasReceber = await buscarContasReceber()
      this.contasPagar = await buscarContasPagar()
    },

    abrirNovaConta() {
      this.contaEdicao = {
        descricao: '',
        valor: 0,
        data_vencimento: new Date().toISOString().split('T')[0],
        forma_pagamento: ''
      }
      this.editando = false
      this.modalAberto = true
    },

    fecharModal() {
      this.modalAberto = false
      this.contaEdicao = null
    },

    async salvarConta(conta) {
      await criarContaPagar(conta.descricao, conta.valor, conta.data_vencimento, conta.forma_pagamento)
      this.fecharModal()
      await this.buscarContas()
    },

    async marcarRecebido(id) {
      await atualizarStatusContaReceber(id, STATUS_RECEBIDO)
      await this.buscarContas()
    },

    async marcarPago(id) {
      await atualizarStatusContaPagar(id, 'pago')
      await this.buscarContas()
    },

    async deletarContaPagar(id) {
      if (!confirm('Excluir conta?')) return
      await supabase.from('contas_pagar').delete().eq('id', id)
      await this.buscarContas()
    },

    formatarPreco(valor) {
      if (!valor) return '0,00'
      return Number(valor).toFixed(2).replace('.', ',')
    },

    formatarData(data) {
      if (!data) return '-'
      return data.split('T')[0].split('-').reverse().join('/')
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

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
}

.tab {
  padding: 10px 16px;
  background: none;
  border: none;
  border-radius: 10px 10px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
}

.tab:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.tab.active {
  background: var(--primary-soft);
  color: var(--primary-hover);
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--danger);
  color: white;
  font-size: 11px;
  font-weight: 700;
  margin-left: 6px;
}

.tab-badge.warning {
  background: var(--warning);
}

.aba-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.resumo-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.resumo-cards.secondary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
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

.card .valor.pendente {
  color: var(--warning);
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
  font-size: 13px;
}

.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.22);
}

.confirm {
  background: var(--success-soft);
  color: var(--success);
  border-color: #bbf7d0;
}

.confirm:hover {
  background: #dcfce7;
}

.delete {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: #fecaca;
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

.status-badge {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.pendente {
  background: var(--warning-soft);
  color: var(--warning);
}

.status-badge.recebido, .status-badge.pago {
  background: var(--success-soft);
  color: var(--success);
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

  table, thead, tbody, th, td, tr {
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
  }
}
</style>
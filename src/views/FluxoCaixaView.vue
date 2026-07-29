<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Fluxo de Caixa</h3>
      <div class="header-actions">
        <button class="primary" @click="abrirNovoLancamento">
          Novo lançamento
        </button>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="filtros">
      <div class="filtro-row">
        <div class="field">
          <label>Período</label>
          <select v-model="periodo" @change="aplicarPeriodo">
            <option value="hoje">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="mes_atual">Este mês</option>
            <option value="mes_anterior">Mês anterior</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        <template v-if="periodo === 'personalizado'">
          <div class="field">
            <label>Início</label>
            <input v-model="dataInicio" type="date" />
          </div>
          <div class="field">
            <label>Fim</label>
            <input v-model="dataFim" type="date" />
          </div>
        </template>

        <div class="field">
          <label>Tipo</label>
          <select v-model="filtroTipo">
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste_positivo">Ajuste positivo</option>
            <option value="ajuste_negativo">Ajuste negativo</option>
          </select>
        </div>

        <div class="field">
          <label>Categoria</label>
          <select v-model="filtroCategoria">
            <option value="">Todas</option>
            <option v-for="cat in categoriasDisponiveis" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="field">
          <label>Forma pagamento</label>
          <select v-model="filtroFormaPagamento">
            <option value="">Todas</option>
            <option v-for="fp in FORMAS_PAGAMENTO" :key="fp" :value="fp">{{ fp }}</option>
          </select>
        </div>

        <div class="field busca-field">
          <label>Buscar</label>
          <input v-model="busca" placeholder="Descrição..." />
        </div>
      </div>
    </div>

    <!-- RESUMO -->
    <div class="resumo-grid">
      <div class="resumo-card" :class="classSaldo">
        <div class="resumo-header">
          <div class="resumo-label">Saldo atual</div>
          <button class="config-btn" title="Configurar valor inicial" @click="abrirValorInicial">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
        <div class="resumo-valor">R$ {{ formatarMoeda(saldoAtual) }}</div>
        <div v-if="saldoInicial.valor_inicial > 0" class="resumo-extra">
          Inicial: R$ {{ formatarMoeda(saldoInicial.valor_inicial) }}
        </div>
      </div>
      <div class="resumo-card entrada">
        <div class="resumo-label">Entradas</div>
        <div class="resumo-valor">R$ {{ formatarMoeda(totalEntradas) }}</div>
      </div>
      <div class="resumo-card saida">
        <div class="resumo-label">Saídas</div>
        <div class="resumo-valor">R$ {{ formatarMoeda(totalSaidas) }}</div>
      </div>
      <div class="resumo-card">
        <div class="resumo-label">Lançamentos</div>
        <div class="resumo-valor">{{ totalLancamentos }}</div>
      </div>
    </div>

    <!-- TABELA -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Forma pagamento</th>
            <th>Valor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="l in lancamentosPaginados"
            :key="l.id"
            :class="'row-' + l.tipo"
          >
            <td data-label="Data">{{ formatarData(l.data) }}</td>
            <td data-label="Tipo">
              <span :class="'tipo-badge ' + l.tipo">{{ tipoLabel(l.tipo) }}</span>
            </td>
            <td data-label="Categoria">{{ l.categoria }}</td>
            <td data-label="Descrição">{{ l.descricao || '-' }}</td>
            <td data-label="Forma pagamento">{{ l.forma_pagamento || '-' }}</td>
            <td data-label="Valor" :class="l.tipo === 'entrada' || l.tipo === 'ajuste_positivo' ? 'valor-positivo' : 'valor-negativo'">
              {{ l.tipo === 'entrada' || l.tipo === 'ajuste_positivo' ? '+' : '-' }} R$ {{ formatarMoeda(l.valor) }}
            </td>
            <td class="actions-cell">
              <div class="actions-wrap">
                <button class="edit" @click="editarLancamento(l)">Editar</button>
                <button class="delete" @click="excluirLancamento(l.id)">Excluir</button>
              </div>
            </td>
          </tr>
          <tr v-if="!carregando && !lancamentosFiltrados.length">
            <td colspan="7" class="empty-msg">Nenhum lançamento encontrado</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="lancamentosFiltrados.length" class="pagination">
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
          {{ lancamentosFiltrados.length }} resultado(s) • Página {{ paginaAtual }} de {{ totalPaginas }}
        </span>
      </div>
      <div class="pagination-actions">
        <button :disabled="paginaAtual === 1" @click="irParaPagina(paginaAtual - 1)">Anterior</button>
        <button :disabled="paginaAtual === totalPaginas" @click="irParaPagina(paginaAtual + 1)">Próxima</button>
      </div>
    </div>

    <!-- GRÁFICO -->
    <div v-if="dadosGrafico.length" class="chart-card">
      <div class="chart-title">Entradas e Saídas por Dia</div>
      <VueApexCharts type="bar" height="220" :options="opcoesGrafico" :series="seriesGrafico" />
    </div>

    <!-- CONTAS A RECEBER -->
    <div class="receber-section">
      <div class="receber-header">
        <h4>Contas a Receber</h4>
        <span class="receber-sub">Vendas no cartão de crédito</span>
      </div>

      <div v-if="contasReceber.length">
        <div class="receber-resumo">
          <div class="receber-card pendente">
            <div class="receber-label">Pendentes</div>
            <div class="receber-valor">R$ {{ formatarMoeda(totalPendente) }}</div>
            <div class="receber-extra">{{ contasPendentes.length }} parcela(s)</div>
          </div>
        </div>

        <!-- PREVISÃO DE RECEBIMENTOS -->
        <div v-if="contasPrevisao.length" class="previsao-section">
          <div class="previsao-header">
            <h5>A receber a partir de hoje</h5>
            <span class="previsao-total">R$ {{ formatarMoeda(totalPrevisao) }} em {{ contasPrevisao.length }} parcela(s)</span>
          </div>
          <div class="table-card">
            <table>
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>Descrição</th>
                  <th>Parcela</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in contasPrevisao" :key="c.id">
                  <td data-label="Vencimento">{{ formatarData(c.data_vencimento) }}</td>
                  <td data-label="Descrição">{{ c.descricao || '-' }}</td>
                  <td data-label="Parcela">{{ c.parcela }}/{{ c.total_parcelas }}</td>
                  <td data-label="Valor">R$ {{ formatarMoeda(c.valor) }}</td>
                  <td class="actions-cell">
                    <button
                      class="btn-receber"
                      :disabled="salvando"
                      @click="receberConta(c)"
                    >Receber</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="contasPendentes.length" class="receber-empty">
          Nenhuma parcela a receber de hoje em diante.
        </div>

        <div v-if="contasReceber.length > itensPorPaginaReceber" class="pagination">
          <div class="pagination-actions">
            <button :disabled="paginaReceberAtual === 1" @click="paginaReceberAtual--">Anterior</button>
            <button :disabled="paginaReceberAtual * itensPorPaginaReceber >= contasReceber.length" @click="paginaReceberAtual++">Próxima</button>
          </div>
        </div>
      </div>

      <div v-else class="receber-empty">
        Nenhuma conta a receber. Execute o backfill para importar vendas antigas.
      </div>
    </div>

    <!-- MODAL VALOR INICIAL -->
    <div v-if="modalValorInicialAberto" class="modal-overlay" @click.self="modalValorInicialAberto = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ saldoInicial.id ? 'Editar' : 'Definir' }} Valor Inicial</h2>
          <button class="close-btn" aria-label="Fechar" @click="modalValorInicialAberto = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Valor inicial (R$)</label>
            <input v-model="formValorInicial.valor_inicial" type="text" inputmode="decimal" placeholder="0,00" @input="filtrarNumero('inicial')" />
          </div>
          <div class="field">
            <label>Data de referência</label>
            <input v-model="formValorInicial.data_referencia" type="date" />
          </div>
          <div class="field">
            <label>Observação</label>
            <input v-model="formValorInicial.observacao" placeholder="Opcional" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" :disabled="salvando" @click="salvarValorInicial">
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
          <button class="btn btn-ghost" :disabled="salvando" @click="modalValorInicialAberto = false">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- MODAL LANÇAMENTO -->
    <div v-if="modalLancamentoAberto" class="modal-overlay" @click.self="modalLancamentoAberto = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ editando ? 'Editar' : 'Novo' }} Lançamento</h2>
          <button class="close-btn" aria-label="Fechar" @click="modalLancamentoAberto = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field">
              <label>Tipo *</label>
              <select v-model="formLancamento.tipo" required>
                <option value="">Selecione</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste_positivo">Ajuste positivo</option>
                <option value="ajuste_negativo">Ajuste negativo</option>
              </select>
            </div>
            <div class="field">
              <label>Valor (R$) *</label>
              <input v-model="formLancamento.valor" type="text" inputmode="decimal" placeholder="0,00" required @input="filtrarNumero('lancamento')" />
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label>Data *</label>
              <input v-model="formLancamento.data" type="date" required />
            </div>
            <div class="field">
              <label>Forma de pagamento *</label>
              <select v-model="formLancamento.forma_pagamento">
                <option value="">Selecione</option>
                <option v-for="fp in FORMAS_PAGAMENTO" :key="fp" :value="fp">{{ fp }}</option>
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label>Categoria *</label>
              <select v-model="formLancamento.categoria" required>
                <option value="">Selecione</option>
                <option v-for="cat in categoriasSugeridas" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Descrição *</label>
            <input v-model="formLancamento.descricao" placeholder="Descrição do lançamento" />
          </div>

          <div class="field">
            <label>Observação</label>
            <input v-model="formLancamento.observacao" placeholder="Opcional" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" :disabled="salvando" @click="salvarLancamento">
            {{ salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Salvar' }}
          </button>
          <button class="btn btn-ghost" :disabled="salvando" @click="modalLancamentoAberto = false">Cancelar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import VueApexCharts from 'vue3-apexcharts'

function hoje() { return new Date().toISOString().split('T')[0] }

function diasAtras(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function inicioMes(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

function fimMes(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
}

const CATEGORIAS_ENTRADA = [
  'Vendas',
  'Recebimentos',
  'Aportes',
  'Reembolsos',
  'Outros',
]

const CATEGORIAS_SAIDA = [
  'Matéria-prima',
  'Embalagens',
  'Frete',
  'Marketing',
  'Manutenção',
  'Contas',
  'Impostos',
  'Outros',
]

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'Pix',
  'Cartão de débito',
  'Cartão de crédito',
  'Transferência',
  'Outro',
]

export default {
  name: 'FluxoCaixaView',

  components: { VueApexCharts },

  data() {
    return {
      carregando: false,
      salvando: false,
      lancamentos: [],
      saldoInicial: {},
      periodo: 'mes_atual',
      dataInicio: '',
      dataFim: '',
      filtroTipo: '',
      filtroCategoria: '',
      filtroFormaPagamento: '',
      busca: '',
      paginaAtual: 1,
      itensPorPagina: 20,
      modalValorInicialAberto: false,
      modalLancamentoAberto: false,
      editando: false,
      lancamentoEditandoId: null,
      novaCategoria: '',
      formValorInicial: this.getFormValorInicialVazio(),
      formLancamento: this.getFormLancamentoVazio(),
      FORMAS_PAGAMENTO,
      contasReceber: [],
      paginaReceberAtual: 1,
      itensPorPaginaReceber: 10,
    }
  },

  computed: {
    hoje() { return hoje() },
    classSaldo() {
      if (this.saldoAtual > 0) return 'positivo'
      if (this.saldoAtual < 0) return 'negativo'
      return 'zerado'
    },

    saldoAtual() {
      const inicial = Number(this.saldoInicial.valor_inicial) || 0
      return this.lancamentos.reduce((acc, l) => {
        if (l.tipo === 'entrada' || l.tipo === 'ajuste_positivo') return acc + Number(l.valor)
        return acc - Number(l.valor)
      }, inicial)
    },

    lancamentosFiltrados() {
      let resultado = [...this.lancamentos]

      if (this.dataInicio && this.dataFim) {
        resultado = resultado.filter(l => l.data >= this.dataInicio && l.data <= this.dataFim)
      }

      if (this.filtroTipo) {
        resultado = resultado.filter(l => l.tipo === this.filtroTipo)
      }

      if (this.filtroCategoria) {
        resultado = resultado.filter(l => l.categoria === this.filtroCategoria)
      }

      if (this.filtroFormaPagamento) {
        resultado = resultado.filter(l => l.forma_pagamento === this.filtroFormaPagamento)
      }

      if (this.busca.trim()) {
        const termo = this.busca.toLowerCase()
        resultado = resultado.filter(l =>
          (l.descricao || '').toLowerCase().includes(termo) ||
          (l.categoria || '').toLowerCase().includes(termo) ||
          (l.observacao || '').toLowerCase().includes(termo)
        )
      }

      return resultado.sort((a, b) => {
        if (a.data !== b.data) return b.data.localeCompare(a.data)
        return (b.id || 0) - (a.id || 0)
      })
    },

    lancamentosFiltradosPeriodo() {
      if (!this.dataInicio || !this.dataFim) return this.lancamentos
      return this.lancamentos.filter(l => l.data >= this.dataInicio && l.data <= this.dataFim)
    },

    totalEntradas() {
      return this.lancamentosFiltradosPeriodo
        .filter(l => l.tipo === 'entrada' || l.tipo === 'ajuste_positivo')
        .reduce((s, l) => s + Number(l.valor), 0)
    },

    totalSaidas() {
      return this.lancamentosFiltradosPeriodo
        .filter(l => l.tipo === 'saida' || l.tipo === 'ajuste_negativo')
        .reduce((s, l) => s + Number(l.valor), 0)
    },

    totalLancamentos() {
      return this.lancamentosFiltradosPeriodo.length
    },

    contasPendentes() {
      return this.contasReceber.filter(c => c.status === 'pendente')
    },

    contasPrevisao() {
      return this.contasPendentes
        .filter(c => c.data_vencimento >= this.hoje)
        .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
    },

    totalPrevisao() {
      return this.contasPrevisao.reduce((s, c) => s + Number(c.valor), 0)
    },

    totalPendente() {
      return this.contasPendentes.reduce((s, c) => s + Number(c.valor), 0)
    },

    totalReceberGeral() {
      return this.contasReceber.reduce((s, c) => s + Number(c.valor), 0)
    },

    totalRecebidoNoMes() {
      const ini = this.dataInicio
      const fim = this.dataFim
      return this.contasReceber
        .filter(c => c.status === 'recebido' && c.data_recebimento >= ini && c.data_recebimento <= fim)
        .reduce((s, c) => s + Number(c.valor), 0)
    },

    contasPaginadas() {
      const inicio = (this.paginaReceberAtual - 1) * this.itensPorPaginaReceber
      return [...this.contasReceber]
        .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
        .slice(inicio, inicio + this.itensPorPaginaReceber)
    },

    lancamentosPaginados() {
      const inicio = (this.paginaAtual - 1) * this.itensPorPagina
      return this.lancamentosFiltrados.slice(inicio, inicio + this.itensPorPagina)
    },

    totalPaginas() {
      return Math.max(1, Math.ceil(this.lancamentosFiltrados.length / this.itensPorPagina))
    },

    categoriasSugeridas() {
      const tipo = this.formLancamento.tipo
      if (tipo === 'entrada' || tipo === 'ajuste_positivo') return CATEGORIAS_ENTRADA
      if (tipo === 'saida' || tipo === 'ajuste_negativo') return CATEGORIAS_SAIDA
      return [...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA]
    },

    categoriasDisponiveis() {
      const cats = this.lancamentos.map(l => l.categoria).filter(Boolean)
      return [...new Set([...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA, ...cats])].sort()
    },

    dadosGrafico() {
      if (!this.dataInicio || !this.dataFim) return []
      const mapa = {}
      const inicio = new Date(this.dataInicio + 'T12:00:00')
      const fim = new Date(this.dataFim + 'T12:00:00')
      const d = new Date(inicio)
      while (d <= fim) {
        const key = d.toISOString().split('T')[0]
        mapa[key] = { entradas: 0, saidas: 0 }
        d.setDate(d.getDate() + 1)
      }
      this.lancamentosFiltradosPeriodo.forEach(l => {
        if (mapa[l.data] !== undefined) {
          if (l.tipo === 'entrada' || l.tipo === 'ajuste_positivo') {
            mapa[l.data].entradas += Number(l.valor)
          } else {
            mapa[l.data].saidas += Number(l.valor)
          }
        }
      })
      return Object.entries(mapa).map(([date, vals]) => ({
        date,
        entradas: Number(vals.entradas.toFixed(2)),
        saidas: Number(vals.saidas.toFixed(2)),
      }))
    },

    seriesGrafico() {
      return [
        { name: 'Entradas', data: this.dadosGrafico.map(d => d.entradas) },
        { name: 'Saídas', data: this.dadosGrafico.map(d => d.saidas) },
      ]
    },

    opcoesGrafico() {
      const categorias = this.dadosGrafico.map(d => {
        const [, m, dia] = d.date.split('-')
        return dia + '/' + m
      })
      return {
        chart: {
          type: 'bar',
          height: 220,
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        colors: ['#2E7D32', '#D94F4F'],
        stroke: { width: 0 },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
        xaxis: {
          categories: categorias,
          labels: { style: { fontSize: '10px', colors: '#A8B3C4' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            formatter: v => 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ','),
            style: { fontSize: '10px', colors: '#A8B3C4' },
          },
        },
        grid: { borderColor: '#F4F5F7', strokeDashArray: 6 },
        dataLabels: { enabled: false },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '12px',
          fontWeight: 600,
          labels: { colors: '#667085' },
          markers: { width: 10, height: 10, radius: 2 },
        },
      }
    },
  },

  watch: {
    busca() { this.paginaAtual = 1 },
    filtroTipo() { this.paginaAtual = 1 },
    filtroCategoria() { this.paginaAtual = 1 },
    filtroFormaPagamento() { this.paginaAtual = 1 },
    itensPorPagina() { this.paginaAtual = 1 },
    periodo() { this.aplicarPeriodo(); this.paginaAtual = 1 },
    dataInicio() { this.paginaAtual = 1 },
    dataFim() { this.paginaAtual = 1 },
    lancamentos() { this.ajustarPagina() },
  },

  mounted() {
    this.aplicarPeriodo()
    this.buscarDados()
    this.buscarSaldoInicial()
    this.buscarContasReceber()
    window.addEventListener('fluxo-caixa-atualizado', this.recarregarTudo)
  },

  beforeUnmount() {
    window.removeEventListener('fluxo-caixa-atualizado', this.recarregarTudo)
  },

  methods: {
    getFormValorInicialVazio() {
      return { valor_inicial: '', data_referencia: hoje(), observacao: '' }
    },

    getFormLancamentoVazio() {
      return {
        tipo: '',
        valor: '',
        data: hoje(),
        categoria: '',
        descricao: '',
        forma_pagamento: '',
        observacao: '',
      }
    },

    async buscarDados() {
      this.carregando = true
      try {
        const { data, error } = await supabase
          .from('fluxo_caixa_lancamentos')
          .select('*')
          .order('data', { ascending: false })
          .order('id', { ascending: false })

        if (error) throw error
        console.log('[FluxoCaixa] buscarDados:', data?.length, 'registros', data)
        this.lancamentos = data || []
        this.ajustarPagina()
      } catch (e) {
        console.error('[FluxoCaixa] erro buscarDados:', e)
        alert('Erro ao carregar lançamentos')
      } finally {
        this.carregando = false
      }
    },

    async buscarContasReceber() {
      const { data, error } = await supabase
        .from('fluxo_caixa_contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: true })

      if (error) { console.error(error); return }
      this.contasReceber = data || []

      const hojeStr = hoje()
      const vencidasPendentes = (data || []).filter(
        c => c.status === 'pendente' && c.data_vencimento <= hojeStr
      )

      for (const conta of vencidasPendentes) {
        const { error: errUpdate } = await supabase
          .from('fluxo_caixa_contas_receber')
          .update({ status: 'recebido', data_recebimento: hojeStr, updated_at: new Date().toISOString() })
          .eq('id', conta.id)

        if (!errUpdate) {
          conta.status = 'recebido'
          conta.data_recebimento = hojeStr

          const jaExiste = this.lancamentos.some(
            l => l.venda_id === conta.venda_id && l.descricao && l.descricao.includes(`Parcela ${conta.parcela}/${conta.total_parcelas}`)
          )
          if (!jaExiste) {
            await supabase.from('fluxo_caixa_lancamentos').insert([{
              tipo: 'entrada',
              valor: conta.valor,
              data: hojeStr,
              categoria: 'Vendas',
              descricao: conta.descricao || 'Recebimento de parcela',
              forma_pagamento: conta.forma_pagamento || null,
              venda_id: conta.venda_id
            }])
          }
        }
      }

      if (vencidasPendentes.length > 0) {
        await this.buscarDados()
      }
    },

    async receberConta(conta) {
      if (!confirm(`Confirmar recebimento de R$ ${this.formatarMoeda(conta.valor)}?`)) return
      this.salvando = true
      try {
        await supabase
          .from('fluxo_caixa_contas_receber')
          .update({ status: 'recebido', data_recebimento: hoje(), updated_at: new Date().toISOString() })
          .eq('id', conta.id)

        await supabase.from('fluxo_caixa_lancamentos').insert([{
          tipo: 'entrada',
          valor: conta.valor,
          data: hoje(),
          categoria: 'Vendas',
          descricao: conta.descricao || 'Recebimento de parcela',
          forma_pagamento: conta.forma_pagamento || 'Cartão de crédito',
          venda_id: conta.venda_id,
        }])

        await this.buscarContasReceber()
        await this.buscarDados()
        alert('Recebimento confirmado')
      } catch (e) {
        console.error(e)
        alert('Erro ao confirmar recebimento')
      } finally {
        this.salvando = false
      }
    },

    async buscarSaldoInicial() {
      const { data, error } = await supabase
        .from('fluxo_caixa_saldo_inicial')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)

      if (error) { console.error(error); return }
      this.saldoInicial = (data && data.length) ? data[0] : {}
    },

    aplicarPeriodo() {
      const hojeStr = hoje()
      switch (this.periodo) {
        case 'hoje':
          this.dataInicio = hojeStr
          this.dataFim = hojeStr
          break
        case '7d':
          this.dataInicio = diasAtras(7)
          this.dataFim = hojeStr
          break
        case 'mes_atual':
          this.dataInicio = inicioMes(new Date())
          this.dataFim = hojeStr
          break
        case 'mes_anterior': {
          const mesAnterior = new Date()
          mesAnterior.setMonth(mesAnterior.getMonth() - 1)
          this.dataInicio = inicioMes(mesAnterior)
          this.dataFim = fimMes(mesAnterior)
          break
        }
        case 'personalizado':
          break
      }
    },

    parseMoney(value) {
      if (!value) return 0
      return parseFloat(String(value).replace(',', '.')) || 0
    },

    formatarMoeda(valor) {
      if (!valor && valor !== 0) return '0,00'
      return Number(valor).toFixed(2).replace('.', ',')
    },

    formatarData(data) {
      if (!data) return '-'
      return data.split('-').reverse().join('/')
    },

    tipoLabel(tipo) {
      const mapa = {
        entrada: 'Entrada',
        saida: 'Saída',
        ajuste_positivo: 'Ajuste +',
        ajuste_negativo: 'Ajuste -',
      }
      return mapa[tipo] || tipo
    },

    abrirValorInicial() {
      if (this.saldoInicial.id) {
        const ini = this.saldoInicial
        this.formValorInicial = {
          valor_inicial: ini.valor_inicial ? this.formatarMoeda(ini.valor_inicial) : '',
          data_referencia: ini.data_referencia || hoje(),
          observacao: ini.observacao || '',
        }
      } else {
        this.formValorInicial = this.getFormValorInicialVazio()
      }
      this.modalValorInicialAberto = true
    },

    async salvarValorInicial() {
      const valor = this.parseMoney(this.formValorInicial.valor_inicial)
      if (valor < 0) {
        alert('Valor inicial não pode ser negativo')
        return
      }

      const payload = {
        valor_inicial: valor,
        data_referencia: this.formValorInicial.data_referencia || hoje(),
        observacao: this.formValorInicial.observacao || null,
      }

      this.salvando = true
      try {
        if (this.saldoInicial.id) {
          if (!confirm('Alterar o valor inicial irá modificar o saldo atual. Continuar?')) return
          await supabase
            .from('fluxo_caixa_saldo_inicial')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', this.saldoInicial.id)
        } else {
          await supabase.from('fluxo_caixa_saldo_inicial').insert([payload])
        }
        this.modalValorInicialAberto = false
        await this.buscarSaldoInicial()
        alert('Valor inicial salvo')
      } catch (e) {
        console.error(e)
        alert('Erro ao salvar valor inicial')
      } finally {
        this.salvando = false
      }
    },

    abrirNovoLancamento() {
      this.editando = false
      this.lancamentoEditandoId = null
      this.formLancamento = this.getFormLancamentoVazio()
      this.modalLancamentoAberto = true
    },

    editarLancamento(l) {
      this.editando = true
      this.lancamentoEditandoId = l.id
      this.formLancamento = {
        tipo: l.tipo,
        valor: this.formatarMoeda(l.valor),
        data: l.data,
        categoria: l.categoria,
        descricao: l.descricao || '',
        forma_pagamento: l.forma_pagamento || '',
        observacao: l.observacao || '',
      }
      this.modalLancamentoAberto = true
    },

    adicionarCategoria() {
      const cat = this.novaCategoria.trim()
      if (!cat) return
      this.formLancamento.categoria = cat
      this.novaCategoria = ''
    },

    filtrarNumero(tipo) {
      const alvo = tipo === 'inicial' ? 'formValorInicial' : 'formLancamento'
      const campo = tipo === 'inicial' ? 'valor_inicial' : 'valor'
      let val = this[alvo][campo] || ''
      val = val.replace(/[^0-9,]/g, '')
      const virgulas = val.match(/,/g)
      if (virgulas && virgulas.length > 1) {
        val = val.replace(/,([^,]*)$/, '$1')
      }
      this[alvo][campo] = val
    },

    async salvarLancamento() {
      if (this.salvando) return

      const valor = this.parseMoney(this.formLancamento.valor)
      const tipo = this.formLancamento.tipo
      const categoria = this.formLancamento.categoria
      const data = this.formLancamento.data
      const descricao = this.formLancamento.descricao
      const formaPagamento = this.formLancamento.forma_pagamento

      if (!tipo) { alert('Selecione o tipo'); return }
      if (!valor || valor <= 0) { alert('Valor deve ser maior que zero'); return }
      if (!data) { alert('Selecione a data'); return }
      if (!formaPagamento) { alert('Selecione a forma de pagamento'); return }
      if (!categoria) { alert('Selecione a categoria'); return }
      if (!descricao || !descricao.trim()) { alert('Descrição é obrigatória'); return }

      const payload = {
        tipo,
        valor,
        data,
        categoria,
        descricao: descricao || null,
        forma_pagamento: this.formLancamento.forma_pagamento || null,
        observacao: this.formLancamento.observacao || null,
      }

      this.salvando = true
      try {
        if (this.editando) {
          await supabase
            .from('fluxo_caixa_lancamentos')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', this.lancamentoEditandoId)
        } else {
          await supabase.from('fluxo_caixa_lancamentos').insert([payload])
        }
        this.modalLancamentoAberto = false
        await this.buscarDados()
      } catch (e) {
        console.error(e)
        alert('Erro ao salvar lançamento')
      } finally {
        this.salvando = false
      }
    },

    async excluirLancamento(id) {
      if (!confirm('Excluir este lançamento? O saldo será alterado.')) return
      try {
        await supabase.from('fluxo_caixa_lancamentos').delete().eq('id', id)
        await this.buscarDados()
      } catch (e) {
        console.error(e)
        alert('Erro ao excluir lançamento')
      }
    },

    async recarregarTudo() {
      await this.buscarDados()
      await this.buscarContasReceber()
    },

    irParaPagina(pagina) {
      this.paginaAtual = pagina
    },

    ajustarPagina() {
      if (this.paginaAtual > this.totalPaginas) {
        this.paginaAtual = this.totalPaginas
      }
    },
  },
}
</script>

<style scoped>
.page {
  padding: 20px 20px 32px;
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
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--primary);
  background: var(--primary);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.primary:hover { background: var(--primary-hover); }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-ghost:hover { background: var(--surface-soft); }

/* Filtros */
.filtros {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 16px;
}

.filtro-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.filtro-row .field {
  flex: 1;
  min-width: 130px;
}

.filtro-row .field label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  display: block;
}

.busca-field { min-width: 160px; }

/* Resumo */
.resumo-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.resumo-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
}

.resumo-card.positivo { border-top: 3px solid var(--success); }
.resumo-card.negativo { border-top: 3px solid var(--danger); }
.resumo-card.zerado { border-top: 3px solid var(--border-strong); }

.resumo-card.entrada .resumo-valor { color: var(--success); }
.resumo-card.saida .resumo-valor { color: var(--danger); }

.resumo-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.resumo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.resumo-header .resumo-label {
  margin-bottom: 0;
}

.config-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.15s, background 0.15s;
}

.config-btn:hover {
  opacity: 1;
  background: var(--surface-soft);
  color: var(--text);
}

.resumo-valor {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  font-feature-settings: 'tnum' 1;
}

.resumo-extra {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Chart */
.chart-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px 12px 4px;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

/* Tabela */
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
  font-size: 13px;
}

thead th {
  background: var(--surface-muted);
  text-align: left;
  padding: 8px 14px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

tbody tr { height: auto; }

tbody tr:nth-child(even) { background: rgba(241,245,249,0.55); }
tbody tr:hover { background: rgba(232,110,26,0.04); }

td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.empty-msg {
  text-align: center;
  color: var(--text-muted);
  padding: 24px !important;
}

.tipo-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.tipo-badge.entrada { color: var(--success); background: var(--success-soft); }
.tipo-badge.saida { color: var(--danger); background: var(--danger-soft); }
.tipo-badge.ajuste_positivo { color: var(--info); background: var(--info-soft); }
.tipo-badge.ajuste_negativo { color: var(--warning); background: var(--warning-soft); }

.valor-positivo { color: var(--success); font-weight: 600; }
.valor-negativo { color: var(--danger); font-weight: 600; }

/* Pagination */
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
  border: 1px solid var(--border);
  color: var(--text);
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.pagination-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

button.edit {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--info);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
button.edit:hover { background: var(--info-soft); }

button.delete {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--danger);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
button.delete:hover { background: var(--danger-soft); }

.actions-cell {
  width: 1%;
  white-space: nowrap;
  text-align: center;
}

.actions-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(15, 23, 42, 0.48);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

.modal {
  background: var(--surface);
  width: 100%; max-width: 480px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  max-height: calc(100vh - 32px);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; gap: 12px;
}

.modal-title { font-size: 18px; font-weight: 600; }

.close-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface-soft); color: var(--text-muted);
  cursor: pointer;
}
.close-btn:hover { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }

.modal-body {
  padding: 20px; overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 14px;
}

.modal-footer {
  display: flex; gap: 8px; padding: 16px 20px;
  border-top: 1px solid var(--border); flex-shrink: 0;
}

.field { display: flex; flex-direction: column; gap: 4px; }
.field label {
  font-size: 11px; color: var(--text-muted); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
}

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.categoria-row {
  display: flex; gap: 6px; align-items: center;
}

.categoria-row select { flex: 1; }

.categoria-input {
  width: 130px !important; flex-shrink: 0;
}

.btn-ghost-sm {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--text);
  font-size: 16px; font-weight: 700; cursor: pointer;
}
.btn-ghost-sm:hover { background: var(--surface-soft); }

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 16px; height: 36px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  cursor: pointer; font-weight: 600; font-size: 13px;
  white-space: nowrap;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--primary); color: white; border-color: var(--primary); }
.btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
.btn-ghost { background: var(--surface); color: var(--text); }
.btn-ghost:hover:not(:disabled) { background: var(--surface-soft); }

/* Responsivo */
@media (max-width: 768px) {
  .page { padding: 16px 12px 24px; }
  .header { flex-direction: column; align-items: stretch; }
  .header h3 { font-size: 20px; }
  .header-actions { width: 100%; flex-direction: column; gap: 8px; }
  .header-actions .primary,
  .header-actions .btn-ghost { width: 100%; justify-content: center; height: 44px; font-size: 14px; }
  .filtro-row { flex-direction: column; }
  .filtro-row .field { min-width: 100%; }
  .resumo-grid { grid-template-columns: 1fr 1fr; }
  .resumo-valor { font-size: 18px; }

  table, thead, tbody, th, td, tr { display: block; }
  thead { display: none; }
  tbody tr {
    background: var(--surface);
    margin-bottom: 12px;
    border-radius: var(--radius-md);
    padding: 14px;
    border: 1px solid var(--border);
  }
  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 8px 4px;
    border: none;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
    min-height: 36px;
  }
  td:last-child { border-bottom: none; }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }
  .actions-cell {
    text-align: left;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    margin-top: 4px;
  }
  .actions-wrap { width: 100%; justify-content: stretch; }
  .actions-wrap button { flex: 1; height: 40px; font-size: 13px; }
  .pagination { flex-direction: column; align-items: stretch; gap: 10px; }
  .pagination-meta { flex-direction: column; align-items: stretch; gap: 10px; }
  .pagination-select { justify-content: space-between; }
  .pagination-select select { width: 100%; height: 40px; font-size: 14px; }
  .pagination-actions { width: 100%; display: flex; gap: 8px; }
  .pagination-actions button { flex: 1; height: 40px; font-size: 13px; }
  .form-grid { grid-template-columns: 1fr; }
}

/* Contas a Receber */
.receber-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  overflow: hidden;
}

.receber-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: baseline; gap: 10px;
}

.receber-header h4 { font-size: 14px; font-weight: 600; color: var(--text); }
.receber-sub { font-size: 11px; color: var(--text-muted); font-weight: 500; }

.receber-resumo {
  display: flex;
  border-bottom: 1px solid var(--border);
}

.receber-card {
  flex: 1;
  padding: 14px 16px;
}
.receber-card.pendente { border-top: 3px solid var(--danger); }
.receber-card.recebido { border-top: 3px solid var(--success); }

.receber-label {
  font-size: 11px; color: var(--text-muted);
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.receber-valor {
  font-size: 20px; font-weight: 700; color: var(--text);
  font-feature-settings: 'tnum' 1;
}

.receber-card.pendente .receber-valor { color: var(--danger); }
.receber-card.recebido .receber-valor { color: var(--success); }

.receber-extra {
  font-size: 11px; color: var(--text-muted); margin-top: 4px;
}

.receber-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.previsao-section {
  border-top: 1px solid var(--border);
  margin-top: 12px;
  padding-top: 12px;
}

.previsao-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 16px 8px;
  gap: 12px;
}

.previsao-header h5 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.previsao-total {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
}

.previsao-section .table-card {
  margin-bottom: 0;
}

.btn-receber {
  height: 30px; padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--success);
  background: var(--success);
  color: white;
  font-size: 12px; font-weight: 600; cursor: pointer;
  white-space: nowrap;
}
.btn-receber:hover:not(:disabled) { background: var(--success-hover); }
.btn-receber:disabled { opacity: 0.5; cursor: not-allowed; }

tr.vencida { background: rgba(217, 79, 79, 0.04) !important; }

@media (max-width: 768px) {
  .receber-card { border-bottom: 1px solid var(--border); }
  .receber-card:last-child { border-bottom: none; }
}
</style>

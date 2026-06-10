<template>
  <div class="page">

    <div class="header">
      <h3>Dashboard Gerencial</h3>
      <div class="header-actions">
        <button class="btn-export" :disabled="!vendas.length" @click="exportarPdf">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          PDF
        </button>
        <button class="btn-export" :disabled="!vendas.length" @click="exportarExcel">
          Excel
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
            <option value="ontem">Ontem</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="mes_atual">Este mês</option>
            <option value="mes_anterior">Mês anterior</option>
            <option value="ano_atual">Este ano</option>
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
          <label>Produto</label>
          <select v-model="produtoFiltro">
            <option value="">Todos</option>
            <option v-for="p in produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>

        <button class="btn-aplicar" :disabled="carregando" @click="aplicarFiltros">
          {{ carregando ? 'Carregando...' : 'Atualizar' }}
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-card--destaque">
        <div class="kpi-label">Faturamento</div>
        <div class="kpi-value">R$ {{ formatarMoeda(kpis.faturamento) }}</div>
        <div class="kpi-trend" :class="kpis.crescimentoFaturamento >= 0 ? 'up' : 'down'">
          {{ kpis.crescimentoFaturamento >= 0 ? '↑' : '↓' }} {{ Math.abs(kpis.crescimentoFaturamento).toFixed(1) }}% vs período anterior
        </div>
        <div class="kpi-trend" :class="kpis.crescimentoMesAnterior >= 0 ? 'up' : 'down'">
          vs mês passado: {{ kpis.crescimentoMesAnterior >= 0 ? '↑' : '↓' }} {{ Math.abs(kpis.crescimentoMesAnterior).toFixed(1) }}%
        </div>
      </div>

      <div class="kpi-subgrid">
        <div class="kpi-card">
          <div class="kpi-label">Lucro</div>
          <div class="kpi-value">R$ {{ formatarMoeda(kpis.lucro) }}</div>
          <div class="kpi-trend subtle">
            Margem {{ kpis.margemLucro.toFixed(1) }}%
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Qtd. Vendida</div>
          <div class="kpi-value">{{ kpis.quantidade }}</div>
          <div class="kpi-trend subtle">unidades</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Pedidos</div>
          <div class="kpi-value">{{ kpis.pedidos }}</div>
          <div class="kpi-trend subtle">vendas</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Ticket Médio</div>
          <div class="kpi-value">R$ {{ formatarMoeda(kpis.ticketMedio) }}</div>
          <div class="kpi-trend subtle">por pedido</div>
        </div>
      </div>
    </div>

    <!-- RANKINGS -->
    <div class="rankings-grid">
      <div class="table-card">
        <div class="table-title">Ranking de Produtos</div>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtde</th>
              <th>Receita</th>
              <th>Lucro</th>
              <th>Margem</th>
              <th>% Receita</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in rankingProdutos" :key="p.nome" :class="{ destaque: p.nome !== 'Outros' && p.receita === maiorReceita }">
              <td data-label="Produto">{{ p.nome }}</td>
              <td data-label="Qtde">{{ p.quantidade }}</td>
              <td data-label="Receita">R$ {{ formatarMoeda(p.receita) }}</td>
              <td data-label="Lucro">R$ {{ formatarMoeda(p.lucro) }}</td>
              <td data-label="Margem">{{ p.margem.toFixed(1) }}%</td>
              <td data-label="% Receita" class="pct-col">{{ p.pctReceita.toFixed(1) }}%</td>
            </tr>
            <tr v-if="!rankingProdutos.length">
              <td colspan="6" class="empty-cell">Nenhum produto no período</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-card">
        <div class="table-title">Ranking de Clientes</div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Pedidos</th>
              <th>Receita</th>
              <th>Ticket Médio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in rankingClientes" :key="c.cliente">
              <td data-label="Cliente">{{ c.cliente || 'Sem nome' }}</td>
              <td data-label="Pedidos">{{ c.pedidos }}</td>
              <td data-label="Receita">R$ {{ formatarMoeda(c.receita) }}</td>
              <td data-label="Ticket Médio">R$ {{ formatarMoeda(c.ticketMedio) }}</td>
            </tr>
            <tr v-if="!rankingClientes.length">
              <td colspan="4" class="empty-cell">Nenhum cliente no período</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ALERTAS / INSIGHTS -->
    <div class="alertas-section">
      <div class="table-title">Insights Automáticos</div>
      <div class="alertas-list">
        <div v-for="(insight, i) in insights" :key="i" class="alerta-item" :class="insight.tipo">
          <span class="alerta-icon">{{ insight.tipo === 'positivo' ? '↑' : insight.tipo === 'negativo' ? '↓' : '•' }}</span>
          <span class="alerta-texto">{{ insight.texto }}</span>
          <router-link v-if="insight.acao" :to="insight.acao" class="alerta-acao">{{ insight.acaoLabel || 'Ver' }}</router-link>
        </div>
        <div v-if="!insights.length" class="alerta-item neutro">
          <span class="alerta-icon">•</span>
          <span class="alerta-texto">Nenhum insight disponível para o período selecionado.</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { supabase } from '../services/supabase'

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

function inicioAno(d) {
  return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]
}

export default {
  name: 'DashboardView',

  data() {
    return {
      carregando: false,
      vendas: [],
      produtos: [],
      periodo: '30d',
      produtoFiltro: '',
      dataInicio: '',
      dataFim: ''
    }
  },

  computed: {
    mesAtual() {
      return new Date().getMonth() + 1
    },

    faturamentoPorMes() {
      const mapa = {}
      const anoAtual = new Date().getFullYear()
      for (let i = 1; i <= 12; i++) mapa[i] = { realizado: 0, custo: 0 }
      this.vendas.forEach(v => {
        const data = v.data_venda?.split('T')[0]
        if (!data) return
        const mes = new Date(data + 'T12:00:00').getMonth() + 1
        const ano = new Date(data + 'T12:00:00').getFullYear()
        if (ano === anoAtual) {
          mapa[mes].realizado += Number(v.total_final || 0)
          mapa[mes].custo += (v.itens_venda_erp || []).reduce((s, item) =>
            s + ((item.quantidade || 0) * (item.preco_custo || item.produtos_erp?.preco_custo || 0)), 0)
        }
      })
      return mapa
    },

    vendasFiltradas() {
      let resultado = [...this.vendas]

      if (this.dataInicio && this.dataFim) {
        resultado = resultado.filter(v => {
          const data = v.data_venda?.split('T')[0]
          return data >= this.dataInicio && data <= this.dataFim
        })
      }

      if (this.produtoFiltro) {
        resultado = resultado.filter(v =>
          v.itens_venda_erp?.some(i => i.produto_id === this.produtoFiltro)
        )
      }

      return resultado
    },

    periodoAnterior() {
      if (!this.dataInicio || !this.dataFim) return []
      const inicio = new Date(this.dataInicio)
      const fim = new Date(this.dataFim)
      const duracao = fim - inicio
      const fimAnterior = new Date(inicio.getTime() - 86400000)
      const inicioAnterior = new Date(fimAnterior.getTime() - duracao)
      const iniStr = inicioAnterior.toISOString().split('T')[0]
      const fimStr = fimAnterior.toISOString().split('T')[0]

      return this.vendas.filter(v => {
        const data = v.data_venda?.split('T')[0]
        return data >= iniStr && data <= fimStr
      })
    },

    kpis() {
      const vendas = this.vendasFiltradas
      const faturamento = vendas.reduce((s, v) => s + (Number(v.total_final) || 0), 0)
      const custoTotal = vendas.reduce((s, v) =>
        s + (v.itens_venda_erp || []).reduce((si, item) =>
          si + ((item.quantidade || 0) * (item.preco_custo || item.produtos_erp?.preco_custo || 0)), 0), 0)
      const lucro = faturamento - custoTotal
      const margemLucro = faturamento > 0 ? (lucro / faturamento) * 100 : 0
      const quantidade = vendas.reduce((s, v) =>
        s + (v.itens_venda_erp || []).reduce((si, item) => si + (item.quantidade || 0), 0), 0)
      const pedidos = vendas.length
      const ticketMedio = pedidos > 0 ? faturamento / pedidos : 0

      const anterior = this.periodoAnterior
      const faturamentoAnterior = anterior.reduce((s, v) => s + (Number(v.total_final) || 0), 0)
      const crescimentoFaturamento = faturamentoAnterior > 0
        ? ((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100
        : 0

      const mesAtualNum = this.mesAtual
      const mesPassadoNum = mesAtualNum === 1 ? 12 : mesAtualNum - 1
      const anoAtual = new Date().getFullYear()
      const anoPassado = mesAtualNum === 1 ? anoAtual - 1 : anoAtual

      const faturamentoMesPassado = (() => {
        const vendasMesPassado = this.vendas.filter(v => {
          const data = v.data_venda?.split('T')[0]
          if (!data) return false
          const d = new Date(data + 'T12:00:00')
          return d.getMonth() + 1 === mesPassadoNum && d.getFullYear() === anoPassado
        })
        return vendasMesPassado.reduce((s, v) => s + (Number(v.total_final) || 0), 0)
      })()

      const crescimentoMesAnterior = faturamentoMesPassado > 0
        ? ((this.faturamentoPorMes[mesAtualNum]?.realizado || 0) - faturamentoMesPassado) / faturamentoMesPassado * 100
        : 0

      const _diasDecorridos = this.dataInicio && this.dataFim
        ? Math.max(1, Math.ceil((new Date(this.dataFim) - new Date(this.dataInicio)) / 86400000) + 1)
        : 30

      return {
        faturamento, lucro, margemLucro, quantidade, pedidos, ticketMedio,
        crescimentoFaturamento, crescimentoMesAnterior
      }
    },

    rankingProdutos() {
      const mapa = {}
      this.vendasFiltradas.forEach(v => {
        (v.itens_venda_erp || []).forEach(item => {
          const nome = item.produtos_erp?.nome || 'Sem nome'
          if (!mapa[nome]) mapa[nome] = { nome, quantidade: 0, receita: 0, custo: 0 }
          const qtd = item.quantidade || 0
          const sub = Number(item.subtotal || 0)
          const custo = qtd * (item.preco_custo || item.produtos_erp?.preco_custo || 0)
          mapa[nome].quantidade += qtd
          mapa[nome].receita += sub
          mapa[nome].custo += custo
        })
      })

      let lista = Object.values(mapa)
        .map(p => ({ ...p, lucro: p.receita - p.custo, margem: p.receita > 0 ? ((p.receita - p.custo) / p.receita) * 100 : 0 }))
        .sort((a, b) => b.receita - a.receita)

      if (lista.length > 10) {
        const outros = lista.slice(10)
        const consolidado = {
          nome: 'Outros',
          quantidade: outros.reduce((s, p) => s + p.quantidade, 0),
          receita: outros.reduce((s, p) => s + p.receita, 0),
          custo: outros.reduce((s, p) => s + p.custo, 0)
        }
        consolidado.lucro = consolidado.receita - consolidado.custo
        consolidado.margem = consolidado.receita > 0 ? (consolidado.lucro / consolidado.receita) * 100 : 0
        lista = [...lista.slice(0, 10), consolidado]
      }

      const totalReceita = lista.reduce((s, p) => s + p.receita, 0)
      lista.forEach(p => {
        p.pctReceita = totalReceita > 0 ? (p.receita / totalReceita) * 100 : 0
      })

      return lista
    },

    rankingClientes() {
      const mapa = {}
      this.vendasFiltradas.forEach(v => {
        const nome = v.cliente || 'Sem nome'
        if (!mapa[nome]) mapa[nome] = { cliente: nome, pedidos: 0, receita: 0 }
        mapa[nome].pedidos++
        mapa[nome].receita += Number(v.total_final || 0)
      })

      let lista = Object.values(mapa)
        .map(c => ({ ...c, ticketMedio: c.pedidos > 0 ? c.receita / c.pedidos : 0 }))
        .sort((a, b) => b.receita - a.receita)

      if (lista.length > 10) {
        const outros = lista.slice(10)
        lista = [
          ...lista.slice(0, 10),
          {
            cliente: 'Outros',
            pedidos: outros.reduce((s, c) => s + c.pedidos, 0),
            receita: outros.reduce((s, c) => s + c.receita, 0),
            ticketMedio: 0
          }
        ]
        const ultimo = lista[10]
        ultimo.ticketMedio = ultimo.pedidos > 0 ? ultimo.receita / ultimo.pedidos : 0
      }

      return lista
    },

    maiorReceita() {
      const normais = this.rankingProdutos.filter(p => p.nome !== 'Outros')
      return normais.length ? Math.max(...normais.map(p => p.receita)) : 0
    },

    insights() {
      const lista = []
      const { faturamento, _lucro, margemLucro, _quantidade, _pedidos, crescimentoFaturamento } = this.kpis

      if (this.vendasFiltradas.length === 0) return lista

      if (crescimentoFaturamento > 20) {
        lista.push({ tipo: 'positivo', texto: `Faturamento cresceu ${crescimentoFaturamento.toFixed(1)}% em relação ao período anterior.`, acao: '/vendas', acaoLabel: 'Ver vendas' })
      } else if (crescimentoFaturamento < -20) {
        lista.push({ tipo: 'negativo', texto: `Faturamento caiu ${Math.abs(crescimentoFaturamento).toFixed(1)}% em relação ao período anterior. Atenção!`, acao: '/vendas', acaoLabel: 'Analisar' })
      }

      if (margemLucro > 50) {
        lista.push({ tipo: 'positivo', texto: `Margem de lucro está excelente: ${margemLucro.toFixed(1)}%.` })
      } else if (margemLucro < 20 && faturamento > 0) {
        lista.push({ tipo: 'negativo', texto: `Margem de lucro baixa: ${margemLucro.toFixed(1)}%. Verifique os custos.`, acao: '/produtos', acaoLabel: 'Revisar custos' })
      }

      const top = this.rankingProdutos[0]
      if (top && top.receita > 0 && faturamento > 0) {
        const participacao = (top.receita / faturamento) * 100
        if (participacao > 50) {
          lista.push({ tipo: 'info', texto: `"${top.nome}" representa ${participacao.toFixed(1)}% do faturamento.`, acao: '/vendas', acaoLabel: 'Ver vendas' })
        }
      }

      const produtosSemVenda = this.produtos.filter(p => {
        return !this.vendasFiltradas.some(v =>
          (v.itens_venda_erp || []).some(i => i.produto_id === p.id)
        )
      })
      if (produtosSemVenda.length > 0 && produtosSemVenda.length <= 3) {
        lista.push({ tipo: 'negativo', texto: `Produtos sem venda no período: ${produtosSemVenda.map(p => p.nome).join(', ')}.`, acao: '/estoque', acaoLabel: 'Ver estoque' })
      } else if (produtosSemVenda.length > 3) {
        lista.push({ tipo: 'negativo', texto: `${produtosSemVenda.length} produtos sem venda no período. Considere promoções.`, acao: '/estoque', acaoLabel: 'Ver estoque' })
      }

      return lista
    }
  },

  watch: {
    periodo() {
      this.aplicarPeriodo()
    },
    dataInicio() {
      if (this.periodo === 'personalizado') this.carregarDados()
    },
    dataFim() {
      if (this.periodo === 'personalizado') this.carregarDados()
    },
    produtoFiltro() { this.aplicarFiltros() }
  },

  mounted() {
    this.aplicarPeriodo()
    this.carregarDados()
  },

  methods: {
    async carregarDados() {
      this.carregando = true
      try {
        const dataLimite = this.dataInicio || diasAtras(365)
        const fimLimite = this.dataFim || hoje()

        const [vRes, pRes] = await Promise.all([
          supabase.from('vendas_erp').select(`
            id, data_venda, cliente, total_bruto, desconto, total_final, forma_pagamento,
            itens_venda_erp (id, produto_id, quantidade, preco_unitario, preco_custo, subtotal, produtos_erp (nome, preco_custo))
          `).gte('data_venda', dataLimite + 'T00:00:00').lte('data_venda', fimLimite + 'T23:59:59').order('data_venda', { ascending: true }),
          supabase.from('produtos_erp').select('*').order('nome')
        ])

        this.vendas = vRes.data || []
        this.produtos = pRes.data || []
      } catch (e) {
        console.error(e)
      } finally {
        this.carregando = false
      }
    },

    aplicarPeriodo() {
      const hojeStr = hoje()
      switch (this.periodo) {
        case 'hoje':
          this.dataInicio = hojeStr
          this.dataFim = hojeStr
          break
        case 'ontem':
          this.dataInicio = diasAtras(1)
          this.dataFim = diasAtras(1)
          break
        case '7d':
          this.dataInicio = diasAtras(7)
          this.dataFim = hojeStr
          break
        case '30d':
          this.dataInicio = diasAtras(30)
          this.dataFim = hojeStr
          break
        case '90d':
          this.dataInicio = diasAtras(90)
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
        case 'ano_atual':
          this.dataInicio = inicioAno(new Date())
          this.dataFim = hojeStr
          break
        case 'personalizado':
          break
      }
      if (this.periodo !== 'personalizado') {
        this.carregarDados()
      }
    },

    aplicarFiltros() {
      this.carregarDados()
    },

    formatarMoeda(valor) {
      if (!valor) return '0,00'
      return Number(valor).toFixed(2).replace('.', ',')
    },

    async exportarPdf() {
      try {
        const { default: jsPDF } = await import('jspdf')
        await import('jspdf-autotable')
        const doc = new jsPDF({ orientation: 'landscape' })
        doc.setFontSize(16)
        doc.text('Dashboard Gerencial — Relatório', 14, 20)
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Período: ${this.dataInicio.split('-').reverse().join('/')} a ${this.dataFim.split('-').reverse().join('/')}`, 14, 28)

        const colunas = ['Produto', 'Qtde', 'Receita', 'Lucro', 'Margem']
        const linhas = this.rankingProdutos.map(p => [p.nome, p.quantidade, 'R$ ' + this.formatarMoeda(p.receita), 'R$ ' + this.formatarMoeda(p.lucro), p.margem.toFixed(1) + '%'])

        doc.autoTable({
          head: [colunas],
          body: linhas,
          startY: 34,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [232, 110, 26] }
        })

        const finalY = doc.lastAutoTable?.finalY || 34
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        doc.text(`Faturamento: R$ ${this.formatarMoeda(this.kpis.faturamento)} | Lucro: R$ ${this.formatarMoeda(this.kpis.lucro)} | Pedidos: ${this.kpis.pedidos}`, 14, finalY + 10)

        doc.save('dashboard.pdf')
      } catch (e) {
        console.error(e)
        alert('Erro ao exportar PDF')
      }
    },

    async exportarExcel() {
      try {
        const { default: XLSX } = await import('xlsx')
        const dados = this.rankingProdutos.map(p => ({
          Produto: p.nome,
          Quantidade: p.quantidade,
          Receita: Number(p.receita.toFixed(2)),
          Lucro: Number(p.lucro.toFixed(2)),
          Margem: Number(p.margem.toFixed(1))
        }))

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(dados)
        XLSX.utils.book_append_sheet(wb, ws, 'Ranking')
        XLSX.writeFile(wb, 'dashboard.xlsx')
      } catch (e) {
        console.error(e)
        alert('Erro ao exportar Excel')
      }
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
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-export:hover:not(:disabled) {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
  min-width: 140px;
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

.btn-aplicar {
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--primary);
  background: var(--primary);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-aplicar:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-aplicar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
}

.kpi-card--destaque {
  grid-column: span 2;
  border-top: 3px solid var(--primary);
  padding: 20px;
}

.kpi-card--destaque .kpi-value {
  font-size: 32px;
}

.kpi-subgrid {
  grid-column: span 3;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.kpi-subgrid .kpi-card {
  padding: 12px;
}

.kpi-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  font-feature-settings: 'tnum' 1;
}

.kpi-subgrid .kpi-value {
  font-size: 18px;
}

.kpi-trend {
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

.kpi-trend.up { color: var(--success); }
.kpi-trend.down { color: var(--danger); }
.kpi-trend.subtle { color: var(--text-muted); font-weight: 500; }

/* Rankings */
.rankings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow-x: auto;
}

.table-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
}

.table-card table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table-card thead th {
  background: var(--surface-muted);
  text-align: left;
  padding: 8px 14px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.table-card tbody tr:nth-child(even) {
  background: rgba(241,245,249,0.55);
}

.table-card tbody tr:hover {
  background: rgba(232,110,26,0.04);
}

.table-card td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  font-feature-settings: 'tnum' 1;
}

.table-card tbody tr:last-child td {
  border-bottom: none;
}

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 24px !important;
}

tr.destaque td:first-child {
  font-weight: 600;
  color: var(--primary);
}

.pct-col { text-align: right; }

/* Alertas */
.alertas-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}

.alertas-list {
  padding: 8px 16px 14px;
}

.alerta-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--surface-muted);
  font-size: 13px;
}

.alerta-item:last-child {
  border-bottom: none;
}

.alerta-icon {
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.alerta-item.positivo .alerta-icon { color: var(--success); }
.alerta-item.negativo .alerta-icon { color: var(--danger); }
.alerta-item.info .alerta-icon { color: var(--info); }
.alerta-item.neutro .alerta-icon { color: var(--text-muted); }

.alerta-texto {
  color: var(--text);
  flex: 1;
}

.alerta-acao {
  font-size: var(--fs-label);
  font-weight: 600;
  color: var(--info);
  text-decoration: none;
  padding: var(--sp-01) var(--sp-03);
  border-radius: var(--radius-sm);
  background: var(--info-soft);
  white-space: nowrap;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.alerta-acao:hover {
  background: var(--info);
  color: white;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Responsivo */
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .kpi-card--destaque { grid-column: span 2; }
  .kpi-subgrid { grid-column: span 3; }
  .rankings-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .page { padding: 16px 12px 24px; }
  .header { flex-direction: column; align-items: stretch; }
  .header h3 { font-size: 20px; }
  .header-actions { width: 100%; flex-direction: column; }
  .btn-export { width: 100%; justify-content: center; height: 44px; font-size: 14px; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .kpi-card--destaque { grid-column: span 2; padding: 14px; }
  .kpi-card--destaque .kpi-value { font-size: 28px; }
  .kpi-subgrid { grid-column: span 2; gap: 8px; }
  .kpi-subgrid .kpi-card { padding: 10px; }
  .kpi-subgrid .kpi-value { font-size: 16px; }
  .kpi-value { font-size: 18px; }
  .rankings-grid { grid-template-columns: 1fr; }
  .filtro-row { flex-direction: column; }
  .filtro-row .field { min-width: 100%; }
  .btn-aplicar { width: 100%; height: 44px; font-size: 14px; }

  .table-card table, .table-card thead, .table-card tbody, .table-card th, .table-card td, .table-card tr { display: block; }
  .table-card thead { display: none; }
  .table-card tbody tr {
    background: var(--surface);
    margin-bottom: 8px;
    border-radius: var(--radius-md);
    padding: 12px;
    border: 1px solid var(--border);
  }
  .table-card td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    border: none;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .table-card td:last-child { border-bottom: none; }
  .table-card td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }
}
</style>

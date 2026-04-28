<template>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <h3>📊 Insights - Vitrine</h3>
      </div>
      <div class="header-actions">
        <select v-model="periodoGeral" class="input periodo-select">
          <option :value="7">Últimos 7 dias</option>
          <option :value="30">Últimos 30 dias</option>
          <option :value="90">Últimos 90 dias</option>
        </select>
      </div>
    </div>

    <div v-if="carregando" class="loading">
      <div class="spinner"></div>
      Carregando dados...
    </div>

    <div v-else-if="erro" class="error-card">
      <span class="error-icon">⚠️</span>
      {{ erro }}
    </div>

    <div v-else class="insights">

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-primary">
          <div class="kpi-icon">👁️</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatNumber(totalAcessos.periodo) }}</span>
            <span class="kpi-label">Total de Acessos</span>
            <span class="kpi-periodo">{{ periodoGeral }} dias</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">👤</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatNumber(visitantesUnicos) }}</span>
            <span class="kpi-label">Visitantes Únicos</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">📱</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatNumber(acessosMobile) }}</span>
            <span class="kpi-label">Mobile</span>
            <span class="kpi-percent">{{ pctMobile }}%</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">💻</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatNumber(acessosDesktop) }}</span>
            <span class="kpi-label">Desktop</span>
            <span class="kpi-percent">{{ pctDesktop }}%</span>
          </div>
        </div>
      </div>

      <!-- GRÁFICO PRINCIPAL -->
      <div class="chart-card">
        <div class="chart-header">
          <h4>📈 Evolução de Acessos</h4>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-dot" style="background: #f97316"></span>
              Acessos
            </span>
          </div>
        </div>
        <EChartWidget
          type="line"
          :data="dadosGrafico"
          height="280px"
          :show-area="true"
        />
        <div class="chart-stats">
          <div class="stat">
            <span class="stat-value">{{ formatNumber(maiorDia) }}</span>
            <span class="stat-label">Maior dia</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ formatData(melhorDiaData) }}</span>
            <span class="stat-label">Data pico</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ diasComAcesso }}</span>
            <span class="stat-label">Dias com acesso</span>
          </div>
        </div>
      </div>

      <!-- GRÁFICOS 2 COLUNAS -->
      <div class="charts-row">
        <div class="chart-card">
          <div class="chart-header">
            <h4>🏷️ Por Tipo de Produto</h4>
          </div>
          <EChartWidget
            type="bar"
            :data="acessosPorTipo"
            height="260px"
          />
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h4>📂 Por Categoria</h4>
          </div>
          <EChartWidget
            type="pie"
            :data="acessosPorCategoria"
            height="260px"
            :radius="['40%', '70%']"
          />
        </div>
      </div>

      <!-- TOP PRODUTOS -->
      <div class="chart-card">
        <div class="chart-header">
          <h4>⭐ Produtos Mais Acessados</h4>
          <span class="badge">{{ topProdutos.length }} produtos</span>
        </div>
        <div class="top-list">
          <div class="top-header">
            <span>#</span>
            <span>Produto</span>
            <span>Acessos</span>
            <span>Únicos</span>
            <span>%</span>
            <span></span>
          </div>
          <div
            v-for="(produto, index) in topProdutos"
            :key="produto.id"
            class="top-item"
            :class="{ 'top-3': index < 3 }"
          >
            <span class="rank">{{ index + 1 }}</span>
            <div class="product-info">
              <span class="product-name">{{ produto.name }}</span>
              <span class="product-type">{{ produto.tipo }}</span>
            </div>
            <span class="product-accesses">{{ formatNumber(produto.acessos || 0) }}</span>
            <span class="product-unicos">{{ formatNumber(produto.visitantes_unicos || 0) }}</span>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: getPorcentagem(produto.acessos) + '%' }"
              ></div>
            </div>
            <router-link
              :to="`/vitrine/detalhes/${produto.id}`"
              class="view-btn"
            >
              →
            </router-link>
          </div>
        </div>
      </div>

      <!-- TABELA COMPLETA -->
      <div class="chart-card">
        <div class="chart-header">
          <h4>📋 Todos os Produtos</h4>
          <input
            v-model="buscaProduto"
            placeholder="Filtrar..."
            class="input filter-input"
          />
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Categorias</th>
                <th>Acessos</th>
                <th>Únicos</th>
                <th>Mobile</th>
                <th>Desktop</th>
                <th>%</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(produto, index) in produtosFiltrados" :key="produto.id">
                <td>{{ index + 1 }}</td>
                <td class="cell-name">{{ produto.name }}</td>
                <td>{{ produto.tipo }}</td>
                <td class="cell-cats">
                  <span v-for="cat in (produto.categorias || []).slice(0, 3)" :key="cat" class="cat-chip">
                    {{ cat }}
                  </span>
                </td>
                <td class="cell-access">{{ formatNumber(produto.acessos || 0) }}</td>
                <td>{{ formatNumber(produto.visitantes_unicos || 0) }}</td>
                <td>{{ produto.acessos_mobile || 0 }}</td>
                <td>{{ produto.acessos_desktop || 0 }}</td>
                <td>{{ getPorcentagem(produto.acessos) }}%</td>
                <td>
                  <router-link :to="`/vitrine/detalhes/${produto.id}`" class="icon-btn">
                    📊
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- INSIGHTS ADICIONAIS -->
      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">🏆</span>
            <span class="insight-title">Líder</span>
          </div>
          <div class="insight-value">{{ produtoTop.name }}</div>
          <div class="insight-desc">{{ formatNumber(produtoTop.acessos) }} acessos</div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">📂</span>
            <span class="insight-title">Categoria</span>
          </div>
          <div class="insight-value">{{ categoriaTop }}</div>
          <div class="insight-desc">{{ formatNumber(categoriaTopAcessos) }} acessos</div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">🏷️</span>
            <span class="insight-title">Tipo</span>
          </div>
          <div class="insight-value">{{ tipoTop }}</div>
          <div class="insight-desc">{{ formatNumber(tipoTopAcessos) }} acessos</div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">📸</span>
            <span class="insight-title">Fonte Principal</span>
          </div>
          <div class="insight-value">{{ fonteTop }}</div>
          <div class="insight-desc">{{ formatNumber(fonteTopAcessos) }} acessos</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import EChartWidget from '../components/EChartWidget.vue'

export default {
  components: { EChartWidget },

  data() {
    return {
      periodoGeral: 30,
      carregando: false,
      erro: '',
      vitrine: [],
      acessosDiarios: [],
      analytics: [],
      buscaProduto: '',
      dataInicio: ''
    }
  },

  mounted() {
    this.buscarDados()
  },

  methods: {
    async buscarDados() {
      this.carregando = true
      this.erro = ''

      try {
        const dataInicio = new Date()
        dataInicio.setDate(dataInicio.getDate() - this.periodoGeral)
        this.dataInicio = dataInicio.toISOString().split('T')[0]

        const [produtosResult, acessosResult] = await Promise.all([
          supabase.from('vitrine').select('*').order('acessos', { ascending: false }),
          supabase
            .from('vitrine_acessos')
            .select('vitrine_id, ip_hash, dispositivo, fonte, data_acesso')
            .gte('data_acesso', this.dataInicio)
        ])

        if (produtosResult.error) throw produtosResult.error

        this.vitrine = produtosResult.data || []
        const acessos = acessosResult.data || []

        this.processarDados(acessos)

      } catch (error) {
        console.error(error)
        this.erro = error.message
      } finally {
        this.carregando = false
      }
    },

    processarDados(acessos) {
      const diarios = {}
      const porProduto = {}

      acessos.forEach(a => {
        const data = a.data_acesso
        const pid = a.vitrine_id
        
        if (!diarios[data]) diarios[data] = 0
        diarios[data]++
        
        if (!porProduto[pid]) {
          porProduto[pid] = {
            acessos: 0,
            visitantes: new Set(),
            mobile: 0,
            desktop: 0
          }
        }
        porProduto[pid].acessos++
        if (a.ip_hash) porProduto[pid].visitantes.add(a.ip_hash)
        if (a.dispositivo === 'mobile') porProduto[pid].mobile++
        else porProduto[pid].desktop++
      })

      this.acessosDiarios = Object.entries(diarios)
        .map(([data, total]) => {
          const d = new Date(data)
          return {
            data,
            label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            dias: 0,
            total
          }
        })
        .sort((a, b) => new Date(a.data) - new Date(b.data))

      this.analytics = this.vitrine.map(p => ({
        ...p,
        acessos: porProduto[p.id]?.acessos || p.acessos || 0,
        visitantes_unicos: porProduto[p.id]?.visitantes?.size || 0,
        acessos_mobile: porProduto[p.id]?.mobile || 0,
        acessos_desktop: porProduto[p.id]?.desktop || 0
      })).sort((a, b) => b.acessos - a.acessos)

      this.vitrine = this.vitrine.map(p => ({
        ...p,
        acessos: porProduto[p.id]?.acessos || p.acessos || 0,
        visitantes_unicos: porProduto[p.id]?.visitantes?.size || 0,
        acessos_mobile: porProduto[p.id]?.mobile || 0,
        acessos_desktop: porProduto[p.id]?.desktop || 0
      }))
    },

    formatNumber(num) {
      if (!num && num !== 0) return '0'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
      return num.toString()
    },

    formatData(data) {
      if (!data) return '-'
      return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    },

    getPorcentagem(acessos) {
      if (!this.maxAcessos) return 0
      return Math.round((acessos / this.maxAcessos) * 100)
    }
  },

  computed: {
    totalAcessos() {
      return this.acessosDiarios.reduce((s, d) => s + d.total, 0)
    },

    visitantesUnicos() {
      const allIps = new Set()
      this.vitrine.forEach(p => {
        if (p.visitantes_unicos > 0) allIps.add(p.visitantes_unicos)
      })
      return this.analytics.reduce((s, p) => s + (p.visitantes_unicos || 0), 0)
    },

    acessosMobile() {
      return this.analytics.reduce((s, p) => s + (p.acessos_mobile || 0), 0)
    },

    acessosDesktop() {
      return this.analytics.reduce((s, p) => s + (p.acessos_desktop || 0), 0)
    },

    pctMobile() {
      const total = this.acessosMobile + this.acessosDesktop
      return total > 0 ? Math.round((this.acessosMobile / total) * 100) : 0
    },

    pctDesktop() {
      return 100 - this.pctMobile
    },

    dadosGrafico() {
      const dias = this.periodoGeral
      const dados = []
      const hoje = new Date()

      for (let i = dias - 1; i >= 0; i--) {
        const data = new Date(hoje)
        data.setDate(data.getDate() - i)
        const dataStr = data.toISOString().split('T')[0]
        const existente = this.acessosDiarios.find(d => d.data === dataStr)
        
        dados.push({
          data: dataStr,
          label: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          dias: i,
          total: existente?.total || 0
        })
      }

      return dados
    },

    maiorDia() {
      if (this.acessosDiarios.length === 0) return 0
      return Math.max(...this.acessosDiarios.map(d => d.total))
    },

    melhorDiaData() {
      const melhor = this.acessosDiarios.find(d => d.total === this.maiorDia)
      return melhor?.data || '-'
    },

    diasComAcesso() {
      return this.acessosDiarios.filter(d => d.total > 0).length
    },

    maxAcessos() {
      if (this.vitrine.length === 0) return 1
      return Math.max(...this.vitrine.map(p => p.acessos || 0), 1)
    },

    topProdutos() {
      return this.vitrine.slice(0, 15)
    },

    produtosFiltrados() {
      if (!this.buscaProduto) return this.vitrine
      const termo = this.buscaProduto.toLowerCase()
      return this.vitrine.filter(p => 
        (p.name || '').toLowerCase().includes(termo) ||
        (p.tipo || '').toLowerCase().includes(termo) ||
        (p.categorias || []).some(c => c.toLowerCase().includes(termo))
      )
    },

    acessosPorCategoria() {
      const categorias = {}
      this.vitrine.forEach(p => {
        (p.categorias || []).forEach(cat => {
          if (!categorias[cat]) categorias[cat] = 0
          categorias[cat] += p.acessos || 0
        })
      })
      return Object.entries(categorias)
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
    },

    acessosPorTipo() {
      const tipos = {}
      this.vitrine.forEach(p => {
        const tipo = p.tipo || 'Outro'
        if (!tipos[tipo]) tipos[tipo] = 0
        tipos[tipo] += p.acessos || 0
      })
      return Object.entries(tipos)
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
    },

    produtoTop() {
      return this.topProdutos[0] || { name: '-', acessos: 0 }
    },

    categoriaTop() {
      return this.acessosPorCategoria[0]?.label || '-'
    },

    categoriaTopAcessos() {
      return this.acessosPorCategoria[0]?.total || 0
    },

    tipoTop() {
      return this.acessosPorTipo[0]?.label || '-'
    },

    tipoTopAcessos() {
      return this.acessosPorTipo[0]?.total || 0
    },

    fonteTop() {
      return this.acessosPorFonte[0]?.fonte || 'direto'
    },

    fonteTopAcessos() {
      return this.acessosPorFonte[0]?.total || 0
    },

    acessosPorFonte() {
      const fontes = {}
      this.vitrine.forEach(p => {
        const tipo = p.tipo
        if (!fontes[tipo]) fontes[tipo] = 0
        fontes[tipo] += p.acessos || 0
      })
      return Object.entries(fontes)
        .map(([fonte, total]) => ({ fonte, total }))
        .sort((a, b) => b.total - a.total)
    }
  },

  watch: {
    periodoGeral() {
      this.buscarDados()
    }
  }
}
</script>

<style scoped>
.page { padding: 32px 20px 40px; max-width: 1520px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
.header h3 { font-size: 28px; font-weight: 700; margin: 0; }
.periodo-select { width: auto; min-width: 160px; }
.loading { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 80px; color: var(--text-muted); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: var(--danger-soft); border: 1px solid #fecaca; border-radius: var(--radius-md); color: var(--danger); }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; display: flex; align-items: center; gap: 16px; }
.kpi-card.kpi-primary { background: linear-gradient(135deg, #fff7ed, #ffedd5); border-color: #fed7aa; }
.kpi-icon { font-size: 28px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--surface); border-radius: 12px; }
.kpi-content { display: flex; flex-direction: column; }
.kpi-value { font-size: 24px; font-weight: 700; }
.kpi-label { font-size: 12px; color: var(--text-muted); }
.kpi-periodo { font-size: 11px; color: var(--primary); font-weight: 600; }
.kpi-percent { font-size: 12px; color: var(--text-muted); }
.chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.chart-header h4 { font-size: 16px; font-weight: 700; margin: 0; }
.chart-legend { display: flex; gap: 16px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; }
.chart-stats { display: flex; justify-content: center; gap: 40px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
.chart-stats .stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.chart-stats .stat-value { font-size: 20px; font-weight: 700; }
.chart-stats .stat-label { font-size: 12px; color: var(--text-muted); }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.badge { padding: 4px 10px; background: var(--surface-soft); border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--text-muted); }
.top-list { display: flex; flex-direction: column; }
.top-header { display: grid; grid-template-columns: 40px 1fr 80px 80px 80px 50px; gap: 12px; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border); }
.top-item { display: grid; grid-template-columns: 40px 1fr 80px 80px 80px 50px; gap: 12px; padding: 14px 16px; align-items: center; border-bottom: 1px solid var(--border); }
.top-item:hover { background: var(--surface-soft); }
.top-item.top-3 { background: #fff7ed; }
.rank { font-size: 14px; font-weight: 700; color: var(--primary); }
.product-info { display: flex; flex-direction: column; min-width: 0; }
.product-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-type { font-size: 12px; color: var(--text-muted); }
.product-accesses, .product-unicos { font-size: 16px; font-weight: 700; }
.product-accesses { color: var(--primary); }
.progress-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-hover)); border-radius: 3px; transition: width 0.3s; }
.view-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; text-decoration: none; font-size: 14px; }
.filter-input { width: 150px; }
.table-container { overflow-x: auto; }
.table-container table { width: 100%; border-collapse: collapse; }
.table-container th { text-align: left; padding: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--surface-soft); }
.table-container td { padding: 12px; font-size: 13px; border-bottom: 1px solid var(--border); }
.cell-name { font-weight: 600; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-cats { display: flex; gap: 4px; flex-wrap: wrap; }
.cat-chip { padding: 2px 8px; background: var(--surface-soft); border-radius: 999px; font-size: 11px; color: var(--text-muted); }
.cell-access { font-weight: 700; color: var(--primary); }
.icon-btn { text-decoration: none; font-size: 16px; }
.insights-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.insight-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.insight-header { display: flex; align-items: center; gap: 8px; }
.insight-icon { font-size: 18px; }
.insight-title { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.insight-value { font-size: 18px; font-weight: 700; }
.insight-desc { font-size: 12px; color: var(--text-muted); }
@media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .charts-row { grid-template-columns: 1fr; } .insights-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .page { padding: 24px 12px 32px; } .header { flex-direction: column; align-items: stretch; } .kpi-grid { grid-template-columns: 1fr; } .top-header, .top-item { grid-template-columns: 32px 1fr 60px 50px 40px; } }
</style>
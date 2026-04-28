<template>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <router-link to="/vitrine" class="back-link">← Voltar</router-link>
        <h3>{{ produto?.name || 'Detalhes do Produto' }}</h3>
      </div>
      <div class="header-actions">
        <select v-model="periodo" class="input periodo-select">
          <option :value="7">7 dias</option>
          <option :value="30">30 dias</option>
          <option :value="90">90 dias</option>
        </select>
      </div>
    </div>

    <div v-if="carregando" class="loading">
      <div class="spinner"></div>
      Carregando...
    </div>

    <div v-else-if="erro" class="error-card">
      <span class="error-icon">⚠️</span>
      {{ erro }}
    </div>

    <div v-else-if="produto" class="detalhes">

      <!-- CARD PRODUTO -->
      <div class="produto-card">
        <div class="produto-image">
          <img v-if="produto.images?.length" :src="produto.images[0]" :alt="produto.name" />
          <div v-else class="no-image">Sem imagem</div>
        </div>
        
        <div class="produto-info">
          <h4>{{ produto.name }}</h4>
          <p class="tipo">{{ produto.tipo }}</p>
          
          <div class="categorias">
            <span v-for="cat in produto.categorias" :key="cat" class="cat-chip">
              {{ cat }}
            </span>
          </div>

          <div class="meta">
            <span>{{ produto.variacoes?.length || 0 }} variações</span>
          </div>
        </div>

        <div class="produto-actions">
          <router-link :to="`/vitrine/editar/${produto.id}`" class="edit-btn">
            ✏️ Editar
          </router-link>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-primary">
          <div class="kpi-icon">👁️</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatNumber(produto.acessos || 0) }}</span>
            <span class="kpi-label">Total Acessos</span>
            <span class="kpi-periodo">{{ periodo }} dias</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">👤</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatNumber(distinctVisitors) }}</span>
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
          <div class="kpi-icon">🏆</div>
          <div class="kpi-content">
            <span class="kpi-value">#{{ posicaoTop }}</span>
            <span class="kpi-label">Ranking</span>
            <span class="kpi-from">de {{ totalProdutos }}</span>
          </div>
        </div>
      </div>

      <!-- GRÁFICO PRINCIPAL -->
      <div class="chart-card">
        <div class="chart-header">
          <h4>📈 Histórico de Acessos</h4>
          <div class="period-tabs">
            <button v-for="p in [7, 30, 90]" :key="p" :class="['period-tab', { active: periodo === p }]" @click="periodo = p">
              {{ p }}d
            </button>
          </div>
        </div>
        <EChartWidget type="line" :data="dadosGrafico" height="280px" :show-area="true" />
      </div>

      <!-- TABELA DETALHADA -->
      <div class="chart-card">
        <div class="chart-header">
          <h4>📋 Detalhamento Diário</h4>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Dia</th>
                <th>Acessos</th>
                <th>Únicos</th>
                <th>Vs Anterior</th>
                <th>Tendência</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dadosTabela" :key="item.data">
                <td>{{ formatData(item.data) }}</td>
                <td>{{ item.diaSemana }}</td>
                <td class="cell-access">{{ item.total }}</td>
                <td>{{ item.unicos }}</td>
                <td :class="item.variacao >= 0 ? 'positive' : 'negative'">
                  {{ item.variacao >= 0 ? '+' : '' }}{{ item.variacao }}%
                </td>
                <td>
                  <span class="trend" :class="item.variacao >= 0 ? 'up' : 'down'">
                    {{ item.variacao >= 0 ? '↑' : '↓' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- INSIGHTS -->
      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">📊</span>
            <span class="insight-title">Conversão</span>
          </div>
          <div class="insight-value">{{ convertidos }}</div>
          <div class="insight-desc">estimado ({{ pctConversao }}%)</div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">📱</span>
            <span class="insight-title">Dispositivo</span>
          </div>
          <div class="insight-value">{{ dispositivoTop }}</div>
          <div class="insight-desc">{{ pctMobile }}% mobile</div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="insight-icon">📸</span>
            <span class="insight-title">Fonte</span>
          </div>
          <div class="insight-value">{{ fonteTop }}</div>
          <div class="insight-desc">{{ acessosFonte }} acessos</div>
        </div>

        <div class="insight-card highlight">
          <div class="insight-header">
            <span class="insight-icon">🎯</span>
            <span class="insight-title">Performance</span>
          </div>
          <div class="insight-value" :class="performanceClass">{{ performanceLabel }}</div>
          <div class="insight-desc">vs média da loja</div>
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
      periodo: 30,
      carregando: false,
      erro: '',
      produto: null,
      todosProdutos: [],
      acessos: [],
      diasSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
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
        const id = this.$route.params.id
        const dataInicio = new Date()
        dataInicio.setDate(dataInicio.getDate() - this.periodo)
        this.dataInicio = dataInicio.toISOString().split('T')[0]

        const [produtoResult, acessosResult, todosResult] = await Promise.all([
          supabase.from('vitrine').select('*, vitrine_variacoes(*, vitrine_precos(*), vitrine_precos_faixas(*))').eq('id', id).single(),
          supabase.from('vitrine_acessos').select('*').eq('vitrine_id', id).gte('data_acesso', this.dataInicio).order('data_acesso', { ascending: true }),
          supabase.from('vitrine').select('id, acessos').order('acessos', { ascending: false })
        ])

        if (produtoResult.error) throw produtoResult.error
        if (todosResult.error) throw todosResult.error

        this.produto = produtoResult.data
        this.todosProdutos = todosResult.data || []
        
        const acessos = acessosResult.data || []
        this.processarAcessos(acessos)

      } catch (error) {
        console.error(error)
        this.erro = error.message
      } finally {
        this.carregando = false
      }
    },

    processarAcessos(acessos) {
      const porData = {}
      const ips = new Set()
      let mobile = 0, desktop = 0, direto = 0, instagram = 0, whatsapp = 0

      acessos.forEach(a => {
        const data = a.data_acesso
        
        if (!porData[data]) porData[data] = { total: 0, unicos: new Set() }
        porData[data].total++
        
        if (a.ip_hash) {
          porData[data].unicos.add(a.ip_hash)
          ips.add(a.ip_hash)
        }
        
        if (a.dispositivo === 'mobile') mobile++
        else desktop++
        
        if (a.fonte === 'direto') direto++
        else if (a.fonte === 'instagram') instagram++
        else if (a.fonte === 'whatsapp') whatsapp++
      })

      this.acessos = Object.entries(porData)
        .map(([data, dados]) => {
          const d = new Date(data)
          return {
            data,
            label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            dias: 0,
            total: dados.total,
            unicos: dados.unicos.size
          }
        })
        .sort((a, b) => new Date(a.data) - new Date(b.data))

      this.dados = porData
      this.distinctVisitors = ips.size
      this.acessosMobile = mobile
      this.acessosDesktop = desktop
      this.acessosDireto = direto
      this.acessosInstagram = instagram
      this.acessosWhatsapp = whatsapp
    },

    formatNumber(num) {
      if (!num && num !== 0) return '0'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
      return num.toString()
    },

    formatData(data) {
      if (!data) return '-'
      return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  },

  computed: {
    dadosGrafico() {
      const dias = this.periodo
      const dados = []
      const hoje = new Date()

      for (let i = dias - 1; i >= 0; i--) {
        const data = new Date(hoje)
        data.setDate(data.getDate() - i)
        const dataStr = data.toISOString().split('T')[0]
        const existente = this.acessos.find(d => d.data === dataStr)
        
        dados.push({
          data: dataStr,
          label: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          dias: i,
          total: existente?.total || 0
        })
      }

      return dados
    },

    dadosTabela() {
      return this.acessos.map((item, index) => {
        const data = new Date(item.data)
        const diaAnterior = index > 0 ? this.acessos[index - 1].total : item.total
        const variacao = diaAnterior > 0 
          ? Math.round(((item.total - diaAnterior) / diaAnterior) * 100)
          : 0

        return {
          ...item,
          diaSemana: this.diasSemana[data.getDay()],
          variacao
        }
      }).sort((a, b) => new Date(b.data) - new Date(a.data))
    },

    distinctVisitors() {
      return this.dados ? Object.values(this.dados).reduce((s, d) => s + d.unicos.size, 0) : 0
    },

    acessosMobile() {
      return this.acessosMobile || 0
    },

    acessosDesktop() {
      return this.acessosDesktop || 0
    },

    pctMobile() {
      const total = this.acessosMobile + this.acessosDesktop
      return total > 0 ? Math.round((this.acessosMobile / total) * 100) : 0
    },

    convertidos() {
      return Math.round((this.produto?.acessos || 0) * 0.05)
    },

    pctConversao() {
      return 5
    },

    posicaoTop() {
      const idx = this.todosProdutos.findIndex(p => p.id === this.produto?.id)
      return idx + 1
    },

    totalProdutos() {
      return this.todosProdutos.length
    },

    dispositivoTop() {
      return this.pctMobile > 50 ? 'Mobile' : 'Desktop'
    },

    fonteTop() {
      if (this.acessosInstagram >= this.acessosWhatsapp && this.acessosInstagram >= this.acessosDireto) return 'Instagram'
      if (this.acessosWhatsapp >= this.acessosDireto) return 'WhatsApp'
      return 'Direto'
    },

    acessosFonte() {
      return Math.max(this.acessosDireto, this.acessosInstagram, this.acessosWhatsapp)
    },

    mediaGeral() {
      const total = this.todosProdutos.reduce((s, p) => s + (p.acessos || 0), 0)
      return total / this.todosProdutos.length || 1
    },

    performanceClass() {
      const pct = ((this.produto?.acessos || 0) / this.mediaGeral) * 100
      if (pct > 150) return 'excellent'
      if (pct > 100) return 'good'
      if (pct > 50) return 'medium'
      return 'low'
    },

    performanceLabel() {
      const pct = ((this.produto?.acessos || 0) / this.mediaGeral) * 100
      if (pct > 150) return 'Excelente'
      if (pct > 100) return 'Bom'
      if (pct > 50) return 'Regular'
      return 'Baixo'
    }
  },

  watch: {
    periodo() {
      this.buscarDados()
    }
  }
}
</script>

<style scoped>
.page { padding: 32px 20px 40px; max-width: 1520px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.back-link { font-size: 14px; color: var(--text-muted); text-decoration: none; padding: 8px 12px; border-radius: 8px; background: var(--surface-soft); }
.header h3 { font-size: 28px; font-weight: 700; margin: 0; }
.periodo-select { width: auto; min-width: 100px; }
.loading { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 80px; color: var(--text-muted); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: var(--danger-soft); border: 1px solid #fecaca; border-radius: var(--radius-md); color: var(--danger); }
.produto-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; display: flex; gap: 20px; margin-bottom: 24px; }
.produto-image { width: 120px; height: 120px; border-radius: 16px; overflow: hidden; background: var(--surface-muted); flex-shrink: 0; }
.produto-image img { width: 100%; height: 100%; object-fit: cover; }
.no-image { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 12px; }
.produto-info { flex: 1; min-width: 0; }
.produto-info h4 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.tipo { color: var(--text-muted); margin: 0 0 12px; }
.categorias { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.cat-chip { padding: 4px 10px; background: var(--surface-soft); border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--text-muted); }
.meta { font-size: 13px; color: var(--text-muted); }
.produto-actions { display: flex; flex-direction: column; gap: 10px; }
.edit-btn { padding: 10px 16px; border-radius: 10px; background: var(--surface-soft); border: 1px solid var(--border); color: var(--text); text-decoration: none; font-weight: 600; font-size: 14px; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; display: flex; align-items: center; gap: 16px; }
.kpi-card.kpi-primary { background: linear-gradient(135deg, #fff7ed, #ffedd5); border-color: #fed7aa; }
.kpi-icon { font-size: 28px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--surface); border-radius: 12px; }
.kpi-content { display: flex; flex-direction: column; }
.kpi-value { font-size: 24px; font-weight: 700; }
.kpi-label { font-size: 12px; color: var(--text-muted); }
.kpi-periodo { font-size: 11px; color: var(--primary); font-weight: 600; }
.kpi-percent { font-size: 12px; color: var(--text-muted); }
.kpi-from { font-size: 11px; color: var(--text-muted); }
.chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.chart-header h4 { font-size: 16px; font-weight: 700; margin: 0; }
.period-tabs { display: flex; gap: 4px; background: var(--surface-soft); padding: 4px; border-radius: 10px; }
.period-tab { padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; background: transparent; color: var(--text-muted); cursor: pointer; }
.period-tab.active { background: var(--primary); color: white; }
.table-container { overflow-x: auto; }
.table-container table { width: 100%; border-collapse: collapse; }
.table-container th { text-align: left; padding: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--surface-soft); }
.table-container td { padding: 12px; font-size: 13px; border-bottom: 1px solid var(--border); }
.cell-access { font-weight: 700; color: var(--primary); }
.positive { color: var(--success); }
.negative { color: var(--danger); }
.trend { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.trend.up { background: var(--success-soft); color: var(--success); }
.trend.down { background: var(--danger-soft); color: var(--danger); }
.insights-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.insight-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.insight-card.highlight { background: linear-gradient(135deg, #fff7ed, #ffedd5); border-color: #fed7aa; }
.insight-header { display: flex; align-items: center; gap: 8px; }
.insight-icon { font-size: 18px; }
.insight-title { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.insight-value { font-size: 20px; font-weight: 700; }
.insight-value.excellent { color: var(--success); }
.insight-value.good { color: var(--primary); }
.insight-value.medium { color: #eab308; }
.insight-value.low { color: var(--danger); }
.insight-desc { font-size: 12px; color: var(--text-muted); }
@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .insights-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .page { padding: 24px 12px 32px; } .header { flex-direction: column; align-items: stretch; } .produto-card { flex-direction: column; } .produto-image { width: 100%; height: 160px; } .kpi-grid { grid-template-columns: 1fr; } .insights-grid { grid-template-columns: 1fr; } }
</style>
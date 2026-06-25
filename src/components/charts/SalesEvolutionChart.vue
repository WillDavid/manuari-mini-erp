<template>
  <div class="chart-card">
    <div class="chart-header">
      <h4 class="chart-title">Evolução do Faturamento</h4>
    </div>

    <template v-if="loading">
      <div class="chart-state">
        <div class="spinner" />
        <span>Carregando dados...</span>
      </div>
    </template>

    <template v-else-if="!data.length">
      <div class="chart-state chart-state--empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
          <path d="M2 20h20" stroke-width="1" />
        </svg>
        <span>Nenhum dado disponível para o período selecionado</span>
      </div>
    </template>

    <template v-else>
      <div class="chart-summary">
        <div class="summary-item">
          <span class="summary-label">Melhor dia</span>
          <span class="summary-value">{{ formatDate(peak.date) }}</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">Maior faturamento</span>
          <span class="summary-value highlight">R$ {{ fmt(peak.revenue) }}</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">Média diária</span>
          <span class="summary-value">R$ {{ fmt(dailyAverage) }}</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">Vs. período anterior</span>
          <span class="summary-value" :class="growth >= 0 ? 'up' : 'down'">
            {{ growth >= 0 ? '+' : '' }}{{ Number(growth).toFixed(1) }}%
          </span>
        </div>
      </div>

      <div class="chart-wrapper">
        <VueApexCharts ref="apexChartRef" type="area" height="280" :options="chartOptions" :series="chartSeries" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  growth: {
    type: Number,
    default: 0
  }
})

const apexChartRef = ref(null)

function getChartDataURI() {
  const chart = apexChartRef.value?.chart
  if (!chart) return null
  return chart.dataURI()
}

defineExpose({ getChartDataURI })

const hasCost = computed(() => props.data.some(d => d.cost !== undefined))

function fmt(val) {
  return Number(val || 0).toFixed(2).replace('.', ',')
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

function formatYLabel(val) {
  const n = Math.round(Number(val) * 100) / 100
  if (!n && n !== 0) return 'R$ 0,00'
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(2).replace('.', ',')} mi`
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(2).replace('.', ',')} k`
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

const peak = computed(() => {
  if (!props.data.length) return { date: '', revenue: 0, index: 0 }
  let best = { date: '', revenue: 0, index: 0 }
  props.data.forEach((d, i) => {
    const v = Number(d.revenue) || 0
    if (v > best.revenue) { best = { date: d.date, revenue: v, index: i } }
  })
  return best
})

const dailyAverage = computed(() => {
  if (!props.data.length) return 0
  const total = props.data.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0)
  return total / props.data.length
})

const visibleLabels = computed(() => {
  const len = props.data.length
  const set = new Set([0, len - 1, peak.value.index])

  let step
  if (len <= 15) step = 1
  else if (len <= 31) step = 3
  else if (len <= 62) step = 5
  else step = 10

  for (let i = 0; i < len; i += step) set.add(i)
  return set
})

const chartSeries = computed(() => {
  const series = [{
    name: 'Faturamento',
    type: 'area',
    data: props.data.map(d => ({
      x: new Date(d.date + 'T12:00:00').getTime(),
      y: Number(d.revenue) || 0
    }))
  }]

  if (hasCost.value) {
    series.push({
      name: 'Custo',
      type: 'line',
      data: props.data.map(d => ({
        x: new Date(d.date + 'T12:00:00').getTime(),
        y: Number(d.cost) || 0
      }))
    })
  }

  return series
})

const chartOptions = computed(() => {
  const avg = dailyAverage.value
  const len = props.data.length
  const visible = visibleLabels.value
  const cost = hasCost.value

  return {
    chart: {
      type: 'area',
      height: 280,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        dynamicAnimation: { speed: 600 },
        easing: 'easeout'
      }
    },
    colors: cost ? ['#E86E1A', '#1F2937'] : ['#E86E1A'],
    stroke: {
      curve: 'straight',
      width: cost ? [3, 2] : 3,
      lineCap: 'round'
    },
    fill: {
      type: cost ? ['gradient', 'solid'] : 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.25,
        opacityTo: 0.04,
        stops: [0, 100]
      }
    },
    legend: cost ? {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontWeight: 600,
      labels: { colors: '#667085' },
      markers: { width: 10, height: 10, radius: 2 },
      itemMargin: { horizontal: 12 }
    } : { show: false },
    markers: {
      size: [props.data.map((_, i) => {
        if (i === len - 1) return 6
        if (i === peak.value.index) return 5
        return 0
      }), 0],
      strokeColors: '#E86E1A',
      strokeWidth: 2,
      fillOpacity: 1,
      hover: { size: 6, sizeOffset: 0 }
    },
    annotations: {
      yaxis: [{
        y: avg,
        borderColor: '#A8B3C4',
        strokeDashArray: 5,
        borderWidth: 1.5,
        label: {
          text: `Média R$ ${formatYLabel(avg)}`,
          offsetY: -8,
          style: {
            fontSize: '10px',
            fontWeight: 600,
            background: '#F4F5F7',
            color: '#667085',
            borderRadius: 3,
            padding: { left: 6, right: 6, top: 2, bottom: 2 }
          }
        }
      }]
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'dd/MM',
        datetimeUTC: false,
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: '#A8B3C4'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    tooltip: { enabled: false },
    yaxis: {
      tickAmount: 5,
      forceNiceScale: true,
      decimalsInFloat: 2,
      labels: {
        formatter: formatYLabel,
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: '#A8B3C4'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    grid: {
      show: true,
      borderColor: '#F4F5F7',
      strokeDashArray: 6,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 8, right: 8 }
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: cost ? [0, 1] : [0],
      formatter(val, { seriesIndex, dataPointIndex }) {
        if (seriesIndex === 1 && !cost) return ''
        return visible.has(dataPointIndex)
          ? `R$ ${Number(val || 0).toFixed(0)}`
          : ''
      },
      offsetY: -6,
      style: {
        fontSize: '10px',
        fontWeight: 600,
        colors: cost ? ['#667085', '#4B5563'] : ['#667085']
      },
      background: { enabled: false }
    }
  }
})
</script>

<style scoped>
.chart-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  overflow: hidden;
}

.chart-header {
  padding: 16px 20px 0;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.chart-summary {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 16px 20px 8px;
}

.summary-item {
  flex: 1;
  min-width: 0;
}

.summary-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
  margin: 0 16px;
  flex-shrink: 0;
}

.summary-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  font-feature-settings: 'tnum' 1;
}

.summary-value.highlight { color: var(--primary); }
.summary-value.up { color: var(--success); }
.summary-value.down { color: var(--danger); }

.chart-wrapper {
  padding: 4px 8px 4px;
}

.chart-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 56px 16px;
  color: var(--text-muted);
  font-size: 13px;
}

.chart-state--empty svg {
  opacity: 0.35;
  color: var(--text-muted);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .chart-summary {
    flex-wrap: wrap;
    gap: 8px 0;
    padding: 12px 12px 4px;
  }

  .summary-item { flex: 0 0 50%; }
  .summary-divider { display: none; }
}
</style>

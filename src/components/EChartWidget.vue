<template>
  <div class="echart-container" ref="containerRef">
    <v-chart
      v-if="options"
      :option="options"
      :autoresize="true"
      :style="{ width: '100%', height: height }"
    />
  </div>
</template>

<script>
import { use } from 'echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

export default {
  name: 'EChartWidget',
  
  props: {
    type: { type: String, default: 'line' },
    title: { type: String, default: '' },
    data: { type: Array, default: () => [] },
    height: { type: String, default: '300px' },
    colors: { type: Array, default: () => null },
    showArea: { type: Boolean, default: false },
    smooth: { type: Boolean, default: true },
    stacked: { type: Boolean, default: false },
    radius: { type: Array, default: () => ['0%', '70%'] }
  },

  data() {
    return {
      defaultColors: [
        '#E86E1A', '#3b82f6', '#2E7D32', '#8b5cf6',
        '#ec4899', '#14b8a6', '#eab308', '#06b6d4'
      ]
    }
  },

  computed: {
    options() {
      if (!this.data || this.data.length === 0) return null
      
      const colors = this.colors || this.defaultColors
      
      switch (this.type) {
        case 'line':
          return this.getLineOptions(colors)
        case 'bar':
          return this.getBarOptions(colors)
        case 'pie':
          return this.getPieOptions(colors)
        case 'donut':
          return this.getPieOptions(colors)
        default:
          return this.getLineOptions(colors)
      }
    }
  },

  methods: {
    getLineOptions(colors) {
      const categorias = this.data.map(d => d.label || d.data)
      const valores = this.data.map(d => d.total || d.value || 0)
      
      const series = [{
        name: this.title,
        type: 'line',
        data: valores,
        smooth: this.smooth,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: colors[0] },
        itemStyle: { color: colors[0] },
        emphasis: { focus: 'series' }
      }]
      
      if (this.showArea) {
        series[0].areaStyle = {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: colors[0] + '40' },
              { offset: 1, color: colors[0] + '05' }
            ]
          }
        }
      }
      
      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          textStyle: { color: '#1f2937', fontSize: 13 },
          formatter: (params) => {
            const p = params[0]
            return `<strong>${p.name}</strong><br/>Acessos: ${p.value}`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: this.title ? '12%' : '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categorias,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 11 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
        },
        series
      }
    },

    getBarOptions(colors) {
      const categorias = this.data.map(d => d.label || d.data)
      const valores = this.data.map(d => d.total || d.value || 0)
      const max = Math.max(...valores, 1)
      
      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          textStyle: { color: '#1f2937', fontSize: 13 },
          formatter: (params) => {
            const p = params[0]
            return `<strong>${p.name}</strong><br/>${p.value} acessos`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: this.title ? '12%' : '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categorias,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { 
            color: '#6b7280', 
            fontSize: 10,
            rotate: this.data.length > 15 ? 45 : 0
          },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
        },
        series: [{
          name: this.title,
          type: 'bar',
          data: valores,
          barMaxWidth: this.data.length > 20 ? 16 : 32,
          itemStyle: {
            color: (params) => {
              const opacity = 0.4 + (params.data / max) * 0.6
              return colors[0] + Math.round(opacity * 255).toString(16).padStart(2, '0')
            },
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: { color: colors[0] }
          }
        }]
      }
    },

    getPieOptions(colors) {
      const dados = this.data.map((d, i) => ({
        name: d.label || d.categoria || d.name,
        value: d.total || d.value || 0
      }))
      
      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          textStyle: { color: '#1f2937', fontSize: 13 },
          formatter: '{b}: <strong>{c}</strong> ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: { color: '#6b7280', fontSize: 12 }
        },
        series: [{
          name: this.title,
          type: 'pie',
          radius: this.radius,
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            color: '#374151',
            fontSize: 12,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,0,0,0.2)'
            }
          },
          data: dados.map((d, i) => ({
            ...d,
            itemStyle: { color: colors[i % colors.length] }
          }))
        }]
      }
    }
  }
}
</script>

<style scoped>
.echart-container {
  width: 100%;
  min-height: 200px;
}
</style>
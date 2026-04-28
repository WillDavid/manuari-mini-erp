<template>
  <div class="chart-container">
    <div class="chart-header">
      <h4>{{ titulo }}</h4>
      <div class="period-selector">
        <button
          v-for="p in periodos"
          :key="p.valor"
          :class="['period-btn', { active: periodoSelecionado === p.valor }]"
          @click="periodoSelecionado = p.valor"
        >
          {{ p.label }}
        </button>
      </div>
    </div>
    
    <div v-if="dadosGrafico.length === 0" class="empty-chart">
      Sem dados no período
    </div>
    
    <div v-else class="chart">
      <div class="bars">
        <div
          v-for="item in dadosGrafico"
          :key="item.data"
          class="bar-wrapper"
        >
          <div
            class="bar"
            :style="{ height: item.porcentagem + '%' }"
            :title="`${item.label}: ${item.total} acessos`"
          >
            <span class="bar-value">{{ item.total }}</span>
          </div>
          <span class="bar-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="totalGeral > 0" class="chart-footer">
      <div class="stat">
        <span class="stat-value">{{ totalGeral }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ mediaDiaria }}</span>
        <span class="stat-label">Média/dia</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ maiorDia }}</span>
        <span class="stat-label">Maior dia</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    titulo: { type: String, default: 'Acessos' },
    dados: { type: Array, default: () => [] }
  },
  
  data() {
    return {
      periodoSelecionado: 7,
      periodos: [
        { label: '7 dias', valor: 7 },
        { label: '30 dias', valor: 30 },
        { label: '90 dias', valor: 90 }
      ]
    }
  },
  
  computed: {
    dadosFiltrados() {
      return this.dados
        .filter(item => item.dias <= this.periodoSelecionado)
        .sort((a, b) => a.dias - b.dias)
    },
    
    dadosGrafico() {
      const max = Math.max(...this.dadosFiltrados.map(d => d.total), 1)
      
      return this.dadosFiltrados.map(item => ({
        ...item,
        label: item.data.split('-').reverse().slice(0, 2).join('/'),
        porcentagem: (item.total / max) * 100
      }))
    },
    
    totalGeral() {
      return this.dadosFiltrados.reduce((sum, item) => sum + item.total, 0)
    },
    
    mediaDiaria() {
      const dias = this.dadosFiltrados.length || 1
      return Math.round(this.totalGeral / dias)
    },
    
    maiorDia() {
      if (this.dadosFiltrados.length === 0) return 0
      return Math.max(...this.dadosFiltrados.map(d => d.total))
    }
  },
  
  watch: {
    periodoSelecionado() {
      this.$emit('periodo', this.periodoSelecionado)
    }
  }
}
</script>

<style scoped>
.chart-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-header h4 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.period-selector {
  display: flex;
  gap: 6px;
}

.period-btn {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
}

.period-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.empty-chart {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.chart {
  height: 200px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 30px;
}

.bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  gap: 4px;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 40px;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, var(--primary), var(--primary-hover));
  border-radius: 6px 6px 0 0;
  min-height: 4px;
  position: relative;
  transition: height 0.3s ease;
  display: flex;
  justify-content: center;
}

.bar-value {
  position: absolute;
  top: -20px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}

.bar-label {
  position: absolute;
  bottom: -24px;
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.chart-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 480px) {
  .chart-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .period-selector {
    width: 100%;
  }
  
  .period-btn {
    flex: 1;
  }
  
  .bar-label {
    font-size: 9px;
  }
}
</style>
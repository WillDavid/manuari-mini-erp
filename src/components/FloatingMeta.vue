<template>
  <div
    v-if="mostrar"
    ref="floatingRef"
    class="floating-meta"
    :class="{ arrastando }"
    :style="estiloPosicao"
    @mousedown="iniciarArrasto"
    @touchstart.passive="iniciarArrastoTouch"
  >
    <div class="meta-header">
      <span class="meta-mes">{{ mesAtual }}</span>
      <div class="meta-header-actions">
        <button class="meta-btn" @click.stop="buscarFaturamento" title="Atualizar">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button class="meta-btn" @click.stop="fechar">✕</button>
      </div>
    </div>
    <div class="meta-body">
      <div class="meta-linha">
        <span class="meta-label">Faturamento</span>
        <span class="meta-valor">R$ {{ formatarMoeda(faturamento) }}</span>
      </div>

      <div class="meta-separador"></div>

      <div class="meta-linha">
        <span class="meta-label">Meta R$ 5.500,00</span>
        <span class="meta-pct-inline">{{ Math.min(porcentagem, 100).toFixed(1) }}%</span>
      </div>
      <div class="meta-bar-wrap">
        <div class="meta-bar-fill" :style="{ width: porcentagem + '%' }" :class="{ superado: porcentagem >= 100 }"></div>
      </div>
      <div class="meta-falta" :class="porcentagem >= 100 ? 'superado' : ''">
        <template v-if="porcentagem < 100">Faltam R$ {{ formatarMoeda(5500 - faturamento) }}</template>
        <template v-else>Superado em R$ {{ formatarMoeda(faturamento - 5500) }}</template>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../services/supabase'

const STORAGE_POS = 'floating_meta_pos'
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default {
  name: 'FloatingMeta',

  data() {
    const saved = this.carregarPosicao()
    return {
      visivel: true,
      faturamento: 0,
      arrastando: false,
      posX: saved.x,
      posY: saved.y,
      offsetX: 0,
      offsetY: 0
    }
  },

  computed: {
    mostrar() {
      return this.visivel && this.$route.path !== '/identificar'
    },
    estiloPosicao() {
      return { left: this.posX + 'px', top: this.posY + 'px' }
    },
    porcentagem() {
      return this.faturamento > 0 ? (this.faturamento / 5500) * 100 : 0
    },
    mesAtual() {
      const agora = new Date()
      return MESES[agora.getMonth()] + ' ' + agora.getFullYear()
    }
  },

  mounted() {
    this.buscarFaturamento()
  },

  methods: {
    carregarPosicao() {
      try {
        const raw = localStorage.getItem(STORAGE_POS)
        if (raw) return JSON.parse(raw)
      } catch (e) { /* ignore */ }
      return { x: 16, y: 80 }
    },

    salvarPosicao() {
      localStorage.setItem(STORAGE_POS, JSON.stringify({ x: this.posX, y: this.posY }))
    },

    formatarMoeda(valor) {
      if (!valor && valor !== 0) return '0,00'
      return Number(valor).toFixed(2).replace('.', ',')
    },

    async buscarFaturamento() {
      const agora = new Date()
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
      const fim = agora.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('vendas_erp')
        .select('total_final')
        .gte('data_venda', inicio + 'T00:00:00')
        .lte('data_venda', fim + 'T23:59:59')

      if (error) { console.error(error); return }

      this.faturamento = (data || []).reduce((s, v) => s + (Number(v.total_final) || 0), 0)
    },

    iniciarArrasto(e) {
      this.arrastando = true
      this.offsetX = e.clientX - this.posX
      this.offsetY = e.clientY - this.posY
      document.addEventListener('mousemove', this.mover)
      document.addEventListener('mouseup', this.pararArrasto)
    },

    iniciarArrastoTouch(e) {
      const touch = e.touches[0]
      this.arrastando = true
      this.offsetX = touch.clientX - this.posX
      this.offsetY = touch.clientY - this.posY
      document.addEventListener('touchmove', this.moverTouch, { passive: false })
      document.addEventListener('touchend', this.pararArrastoTouch)
    },

    mover(e) {
      if (!this.arrastando) return
      this.posX = e.clientX - this.offsetX
      this.posY = e.clientY - this.offsetY
      this.ajustarLimites()
    },

    moverTouch(e) {
      if (!this.arrastando) return
      e.preventDefault()
      const touch = e.touches[0]
      this.posX = touch.clientX - this.offsetX
      this.posY = touch.clientY - this.offsetY
      this.ajustarLimites()
    },

    pararArrasto() {
      this.arrastando = false
      this.salvarPosicao()
      document.removeEventListener('mousemove', this.mover)
      document.removeEventListener('mouseup', this.pararArrasto)
    },

    pararArrastoTouch() {
      this.arrastando = false
      this.salvarPosicao()
      document.removeEventListener('touchmove', this.moverTouch)
      document.removeEventListener('touchend', this.pararArrastoTouch)
    },

    ajustarLimites() {
      const el = this.$refs.floatingRef
      if (!el) return
      const w = window.innerWidth
      const h = window.innerHeight
      const rw = el.offsetWidth
      const rh = el.offsetHeight
      this.posX = Math.max(4, Math.min(this.posX, w - rw - 4))
      this.posY = Math.max(4, Math.min(this.posY, h - rh - 4))
    },

    fechar() {
      this.visivel = false
    }
  }
}
</script>

<style scoped>
@keyframes pulse-border {
  0%, 100% { border-color: var(--primary); box-shadow: 0 8px 32px rgba(232, 110, 26, 0.2), var(--shadow-md); }
  50% { border-color: var(--primary-hover); box-shadow: 0 8px 40px rgba(232, 110, 26, 0.45), var(--shadow-md); }
}

.floating-meta {
  position: fixed;
  z-index: 9999;
  background: var(--surface);
  border: 1.5px solid var(--primary);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(232, 110, 26, 0.2), var(--shadow-md);
  width: 200px;
  user-select: none;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  transition: box-shadow 0.2s;
  animation: pulse-border 2s ease-in-out infinite;
}

.floating-meta.arrastando {
  box-shadow: 0 12px 40px rgba(232, 110, 26, 0.3), var(--shadow-md);
  animation: none;
}

.meta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px 5px;
  background: var(--primary);
  color: white;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: grab;
}

.floating-meta.arrastando .meta-header {
  cursor: grabbing;
}

.meta-header-actions {
  display: flex;
  align-items: center;
  gap: 3px;
}

.meta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(255,255,255,0.2);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 0;
  transition: background 0.15s;
}

.meta-btn:hover {
  background: rgba(255,255,255,0.35);
}

.meta-body {
  padding: 8px 10px 10px;
  cursor: grab;
}

.floating-meta.arrastando .meta-body {
  cursor: grabbing;
}

.meta-linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  margin-bottom: 3px;
}

.meta-label {
  color: var(--text-muted);
  font-weight: 500;
}

.meta-valor {
  font-weight: 700;
  color: var(--text);
  font-feature-settings: 'tnum' 1;
}

.meta-separador {
  height: 1px;
  background: var(--border);
  margin: 6px 0;
}

.meta-falta {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  margin-top: 2px;
}

.meta-falta.superado {
  color: var(--success);
}

.meta-pct-inline {
  font-weight: 700;
  font-size: 11px;
  color: var(--text);
  font-feature-settings: 'tnum' 1;
}

.meta-bar-wrap {
  height: 5px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 3px;
  margin-top: 7px;
  overflow: hidden;
}

.meta-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.5s ease;
  min-width: 0;
}

.meta-bar-fill.superado {
  background: var(--success);
}


</style>

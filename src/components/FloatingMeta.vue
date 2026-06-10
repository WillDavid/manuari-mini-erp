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
        <button class="meta-btn" title="Configurar Metas" aria-label="Configurar metas" @click.stop="abrirConfig">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button class="meta-btn" title="Atualizar" aria-label="Atualizar faturamento" @click.stop="buscarFaturamento">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button class="meta-btn" aria-label="Fechar widget de meta" @click.stop="fechar">✕</button>
      </div>
    </div>
    <div class="meta-body">
      <div class="meta-linha">
        <span class="meta-label">Faturamento</span>
        <span class="meta-valor">R$ {{ formatarMoeda(faturamento) }}</span>
      </div>

      <div class="meta-separador"></div>

      <div class="meta-linha">
        <span class="meta-label">Meta R$ {{ formatarMoeda(metaAtual) }}</span>
        <span class="meta-pct-inline">{{ Math.min(porcentagem, 100).toFixed(1) }}%</span>
      </div>
      <div class="meta-bar-wrap">
        <div class="meta-bar-fill" :style="{ width: porcentagem + '%' }" :class="{ superado: porcentagem >= 100 }"></div>
      </div>
      <div class="meta-falta" :class="porcentagem >= 100 ? 'superado' : ''">
        <template v-if="porcentagem < 100">Faltam R$ {{ formatarMoeda(metaAtual - faturamento) }}</template>
        <template v-else>Superado em R$ {{ formatarMoeda(faturamento - metaAtual) }}</template>
      </div>

      <div v-if="metaAtual === 0" class="meta-aviso">Nenhuma meta definida para este mês.</div>
    </div>

    <!-- MODAL CONFIG METAS -->
     <div v-if="configAberto" class="modal-overlay" @click.self="configAberto = false" @keydown.escape="configAberto = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">Metas Mensais {{ anoConfig }}</h2>
          <button class="close-btn" aria-label="Fechar" @click="configAberto = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <table class="meta-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Meta (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(nome, i) in MESES" :key="i" :class="{ atual: (i + 1) === mesAtualNum }">
                <td>{{ nome }}</td>
                <td>
                  <input
                    v-model.number="metas[i + 1]"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="export-btn-cancel" @click="configAberto = false">Cancelar</button>
          <button class="export-btn-confirm" :disabled="salvando" @click="salvarMetas">
            {{ salvando ? 'Salvando...' : 'Salvar Metas' }}
          </button>
        </div>
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
      metaAtual: 0,
      arrastando: false,
      configAberto: false,
      salvando: false,
      metas: {},
      anoConfig: new Date().getFullYear(),
      posX: saved.x,
      posY: saved.y,
      offsetX: 0,
      offsetY: 0
    }
  },

  computed: {
    MESES() { return MESES },

    mostrar() {
      return this.visivel && this.$route.path !== '/identificar'
    },

    estiloPosicao() {
      return { left: this.posX + 'px', top: this.posY + 'px' }
    },

    porcentagem() {
      return this.metaAtual > 0 ? (this.faturamento / this.metaAtual) * 100 : 0
    },

    mesAtual() {
      const agora = new Date()
      return MESES[agora.getMonth()] + ' ' + agora.getFullYear()
    },

    mesAtualNum() {
      return new Date().getMonth() + 1
    }
  },

  mounted() {
    this.buscarFaturamento()
    this.buscarMetas()
  },

  methods: {
    carregarPosicao() {
      try {
        const raw = localStorage.getItem(STORAGE_POS)
        if (raw) return JSON.parse(raw)
      } catch { /* ignore */ }
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

    async buscarMetas() {
      const ano = new Date().getFullYear()
      this.anoConfig = ano

      const { data, error } = await supabase
        .from('metas_mensais')
        .select('*')
        .eq('ano', ano)

      if (error) { console.error(error); return }

      const mapa = {}
      for (let i = 1; i <= 12; i++) mapa[i] = 0
      ;(data || []).forEach(m => { mapa[m.mes] = Number(m.valor_meta) || 0 })
      this.metas = mapa
      this.metaAtual = mapa[new Date().getMonth() + 1] || 0
    },

    abrirConfig() {
      this.configAberto = true
      this.buscarMetas()
    },

    async salvarMetas() {
      this.salvando = true
      try {
        const ano = this.anoConfig
        const operacoes = []

        for (let mes = 1; mes <= 12; mes++) {
          const valor = Number(this.metas[mes]) || 0
          operacoes.push(
            supabase
              .from('metas_mensais')
              .upsert(
                { ano, mes, valor_meta: valor },
                { onConflict: 'ano, mes' }
              )
              .select()
              .single()
          )
        }

        await Promise.all(operacoes)
        this.configAberto = false
        this.metaAtual = this.metas[new Date().getMonth() + 1] || 0
      } catch (e) {
        console.error(e)
        alert('Erro ao salvar metas')
      } finally {
        this.salvando = false
      }
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
  overflow: visible;
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

.meta-aviso {
  font-size: 10px;
  color: var(--danger);
  font-weight: 600;
  margin-top: 6px;
  text-align: center;
}

/* MODAL CONFIG */
.modal-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(15, 23, 42, 0.48);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

.modal {
  background: var(--surface);
  width: 100%; max-width: 420px;
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

.modal-title { font-size: 18px; font-weight: 600; margin: 0; }

.close-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface-soft); color: var(--text-muted);
  cursor: pointer; transition: all 0.15s;
}

.close-btn:hover { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }

.modal-body { padding: 20px; overflow-y: auto; flex: 1; }

.modal-footer { display: flex; gap: 8px; padding: 16px 20px; border-top: 1px solid var(--border); flex-shrink: 0; justify-content: flex-end; }

.export-btn-cancel {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 16px; height: 36px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  background: var(--surface); color: var(--text);
  cursor: pointer; font-weight: 600; font-size: 13px;
  transition: all 0.15s; white-space: nowrap;
}

.export-btn-cancel:hover { background: var(--surface-soft); }

.export-btn-confirm {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 16px; height: 36px;
  border-radius: var(--radius-sm); border: 1px solid var(--primary);
  background: var(--primary); color: white;
  cursor: pointer; font-weight: 600; font-size: 13px;
  transition: all 0.15s; white-space: nowrap;
}

.export-btn-confirm:hover { filter: brightness(1.1); }

.export-btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.meta-table { width: 100%; border-collapse: collapse; font-size: 13px; }

.meta-table th {
  text-align: left;
  padding: 8px 10px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  position: sticky;
  top: 0;
  z-index: 1;
}

.meta-table td { padding: 6px 10px; border-bottom: 1px solid var(--surface-muted); font-feature-settings: 'tnum' 1; }
.meta-table td:first-child { font-weight: 600; color: var(--text); }
.meta-table tr.atual td:first-child { color: var(--primary); }
.meta-table input { height: 32px; width: 100%; min-width: 80px; }
</style>

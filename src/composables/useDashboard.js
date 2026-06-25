import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'

function hoje() { return new Date().toISOString().split('T')[0] }
function diasAtras(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }
function inicioMes(d) { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0] }
function fimMes(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0] }
function inicioAno(d) { return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0] }

export function useDashboard() {
  const vendas = ref([])
  const produtos = ref([])
  const carregando = ref(false)
  const periodo = ref('30d')
  const produtoFiltro = ref('')
  const clienteFiltro = ref('')
  const dataInicio = ref('')
  const dataFim = ref('')

  const vendasFiltradas = computed(() => {
    let resultado = [...vendas.value]
    if (dataInicio.value && dataFim.value) {
      resultado = resultado.filter(v => {
        const data = v.data_venda?.split('T')[0]
        return data >= dataInicio.value && data <= dataFim.value
      })
    }
    if (produtoFiltro.value) {
      resultado = resultado.filter(v =>
        v.itens_venda_erp?.some(i => i.produto_id === produtoFiltro.value)
      )
    }
    if (clienteFiltro.value) {
      resultado = resultado.filter(v =>
        v.cliente?.toLowerCase().includes(clienteFiltro.value.toLowerCase())
      )
    }
    return resultado
  })

  const periodoAnterior = computed(() => {
    if (!dataInicio.value || !dataFim.value) return []
    const inicio = new Date(dataInicio.value)
    const fim = new Date(dataFim.value)
    const duracao = fim - inicio
    const fimAnterior = new Date(inicio.getTime() - 86400000)
    const inicioAnterior = new Date(fimAnterior.getTime() - duracao)
    const iniStr = inicioAnterior.toISOString().split('T')[0]
    const fimStr = fimAnterior.toISOString().split('T')[0]
    return vendas.value.filter(v => {
      const data = v.data_venda?.split('T')[0]
      return data >= iniStr && data <= fimStr
    })
  })

  const diasDecorridos = computed(() => {
    return dataInicio.value && dataFim.value
      ? Math.max(1, Math.ceil((new Date(dataFim.value) - new Date(dataInicio.value)) / 86400000) + 1)
      : 30
  })

  async function carregarDados() {
    carregando.value = true
    try {
      const dataLimite = dataInicio.value || diasAtras(365)
      const fimLimite = dataFim.value || hoje()

      const [vRes, pRes] = await Promise.all([
        supabase.from('vendas_erp').select(`
          id, data_venda, cliente, total_bruto, desconto, total_final, forma_pagamento,
          itens_venda_erp (id, produto_id, quantidade, preco_unitario, preco_custo, subtotal, produtos_erp (nome, preco_custo))
        `).gte('data_venda', dataLimite + 'T00:00:00').lte('data_venda', fimLimite + 'T23:59:59').order('data_venda', { ascending: true }),
        supabase.from('produtos_erp').select('*').order('nome')
      ])

      vendas.value = vRes.data || []
      produtos.value = pRes.data || []
    } catch (e) {
      console.error(e)
    } finally {
      carregando.value = false
    }
  }

  function aplicarPeriodo() {
    const hojeStr = hoje()
    switch (periodo.value) {
      case 'hoje':
        dataInicio.value = hojeStr; dataFim.value = hojeStr; break
      case 'ontem':
        dataInicio.value = diasAtras(1); dataFim.value = diasAtras(1); break
      case '7d':
        dataInicio.value = diasAtras(7); dataFim.value = hojeStr; break
      case '30d':
        dataInicio.value = diasAtras(30); dataFim.value = hojeStr; break
      case '90d':
        dataInicio.value = diasAtras(90); dataFim.value = hojeStr; break
      case 'mes_atual':
        dataInicio.value = inicioMes(new Date()); dataFim.value = hojeStr; break
      case 'mes_anterior': {
        const mesAnterior = new Date(); mesAnterior.setMonth(mesAnterior.getMonth() - 1)
        dataInicio.value = inicioMes(mesAnterior); dataFim.value = fimMes(mesAnterior); break
      }
      case 'ano_atual':
        dataInicio.value = inicioAno(new Date()); dataFim.value = hojeStr; break
      case 'personalizado': break
    }
    if (periodo.value !== 'personalizado') carregarDados()
  }

  return {
    vendas, produtos, carregando, periodo, produtoFiltro, clienteFiltro,
    dataInicio, dataFim, vendasFiltradas, periodoAnterior, diasDecorridos,
    carregarDados, aplicarPeriodo
  }
}

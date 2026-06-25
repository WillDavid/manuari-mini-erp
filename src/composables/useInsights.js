import { computed } from 'vue'

export function useInsights(vendasFiltradas, kpis, rankingProdutos, rankingClientes, vendasPorDiaSemana, evolucaoDiaria) {
  const insights = computed(() => {
    const lista = []
    const v = vendasFiltradas.value
    if (!v.length) return lista

    const k = kpis.value

    if (k.crescimentoFaturamento > 5) {
      lista.push({ tipo: 'positivo', texto: `Faturamento cresceu ${k.crescimentoFaturamento.toFixed(1)}% em relação ao período anterior.` })
    } else if (k.crescimentoFaturamento < -5) {
      lista.push({ tipo: 'negativo', texto: `Faturamento caiu ${Math.abs(k.crescimentoFaturamento).toFixed(1)}% em relação ao período anterior.` })
    }

    if (k.margemLucro > 50) {
      lista.push({ tipo: 'positivo', texto: `Margem de lucro excelente: ${k.margemLucro.toFixed(1)}%.` })
    } else if (k.margemLucro < 20 && k.faturamento > 0) {
      lista.push({ tipo: 'negativo', texto: `Margem de lucro baixa: ${k.margemLucro.toFixed(1)}%.` })
    }

    const topProd = rankingProdutos.value[0]
    if (topProd && topProd.nome !== 'Outros' && k.faturamento > 0) {
      const pct = (topProd.receita / k.faturamento) * 100
      if (pct > 30) {
        lista.push({ tipo: 'info', texto: `"${topProd.nome}" representa ${pct.toFixed(1)}% do faturamento.` })
      }
    }

    const top3 = rankingProdutos.value.slice(0, 3).filter(p => p.nome !== 'Outros')
    if (top3.length === 3) {
      const pct3 = top3.reduce((s, p) => s + p.receita, 0)
      const total = k.faturamento
      if (total > 0) {
        lista.push({ tipo: 'info', texto: `Os 3 principais produtos representam ${(pct3 / total * 100).toFixed(1)}% da receita.` })
      }
    }

    const topCliente = rankingClientes.value[0]
    if (topCliente && topCliente.cliente !== 'Outros') {
      lista.push({ tipo: 'positivo', texto: `${topCliente.cliente} é o maior cliente do período (R$ ${Number(topCliente.receita).toFixed(2).replace('.', ',')}).` })
    }

    const maisLucrativo = rankingProdutos.value
      .filter(p => p.nome !== 'Outros')
      .sort((a, b) => b.margem - a.margem)[0]
    if (maisLucrativo && maisLucrativo.margem > k.margemLucro) {
      lista.push({ tipo: 'positivo', texto: `"${maisLucrativo.nome}" possui a maior margem (${maisLucrativo.margem.toFixed(1)}%).` })
    }

    if (vendasPorDiaSemana.value.length) {
      const sorted = [...vendasPorDiaSemana.value].sort((a, b) => b.receita - a.receita)
      const best = sorted[0]
      const worst = sorted[sorted.length - 1]
      if (best) lista.push({ tipo: 'info', texto: `${best.dia} possui maior faturamento.` })
      if (worst && worst.receita > 0) lista.push({ tipo: 'info', texto: `${worst.dia} possui menor faturamento.` })
    }

    const diaria = evolucaoDiaria.value
    if (diaria.length >= 7) {
      const recente = diaria.slice(-7)
      const inicio = recente[0]?.receita || 0
      const fim = recente[recente.length - 1]?.receita || 0
      if (inicio > 0 && fim > inicio) {
        lista.push({ tipo: 'positivo', texto: 'Existe tendência de crescimento nos últimos 7 dias.' })
      } else if (inicio > 0 && fim < inicio) {
        lista.push({ tipo: 'negativo', texto: 'Existe tendência de queda nos últimos 7 dias.' })
      }
    }

    const margemAnterior = rankingProdutos.value
      .filter(p => p.nome !== 'Outros')
      .reduce((s, p) => s + p.margem, 0) / Math.max(1, rankingProdutos.value.filter(p => p.nome !== 'Outros').length)
    if (margemAnterior > 0 && k.margemLucro < margemAnterior) {
      lista.push({ tipo: 'negativo', texto: `A margem caiu ${(margemAnterior - k.margemLucro).toFixed(1)}% em relação à média geral.` })
    }

    const semVenda = vendasFiltradas.value.filter(v =>
      !v.itens_venda_erp?.length
    )
    if (semVenda.length > 3) {
      lista.push({ tipo: 'info', texto: `${semVenda.length} vendas sem itens registrados.` })
    }

    return lista
  })

  return { insights }
}

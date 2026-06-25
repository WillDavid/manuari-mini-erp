export const CORES = {
  primary: '#E86E1A',
  primaryLight: '#FEF0E7',
  success: '#2E7D32',
  danger: '#D94F4F',
  warning: '#B45309',
  info: '#1D4ED8',
  text: '#1F2937',
  textMuted: '#667085',
  border: '#D9DEE5',
  surface: '#FFFFFF',
  bg: '#F4F5F7'
}

function moeda(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',')
}

function formatarData(data) {
  if (!data) return ''
  return data.split('-').reverse().join('/')
}

export function useCharts() {
  function chartBase() {
    return {
      chart: {
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: { enabled: true, dynamicAnimation: { speed: 500 } },
        fontFamily: 'Inter, sans-serif',
        foreColor: CORES.textMuted
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      grid: { borderColor: CORES.border, strokeDashArray: 4 },
      tooltip: { theme: 'light', style: { fontSize: '12px' } },
      responsive: [{
        breakpoint: 768,
        options: { chart: { height: 280 }, legend: { position: 'bottom' } }
      }]
    }
  }

  function receitaChartOptions(diaria) {
    if (!diaria.length) return null
    const categorias = diaria.map(d => formatarData(d.data))
    const receita = diaria.map(d => Number(d.receita.toFixed(2)))

    const mediaMovel = diaria.map((_, i) => {
      if (i < 3) return null
      const slice = diaria.slice(i - 3, i + 1)
      return slice.reduce((s, d) => s + d.receita, 0) / slice.length
    })

    return {
      ...chartBase(),
      title: { text: 'Evolucao do Faturamento', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [
        { name: 'Receita', type: 'line', data: receita, color: CORES.primary },
        { name: 'MediaMovel (4d)', type: 'line', data: mediaMovel, color: CORES.success, dashArray: 5 }
      ],
      xaxis: { categories: categorias, type: 'datetime', labels: { rotate: -45, maxHeight: 60 } },
      yaxis: { labels: { formatter: v => 'R$ ' + (v / 1000).toFixed(0) + 'k' } }
    }
  }

  function pedidosChartOptions(diaria) {
    if (!diaria.length) return null
    const categorias = diaria.map(d => formatarData(d.data))
    const pedidos = diaria.map(d => d.pedidos)

    return {
      ...chartBase(),
      title: { text: 'Pedidos por Dia', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [{ name: 'Pedidos', data: pedidos, color: CORES.info }],
      chart: { ...chartBase().chart, type: 'bar' },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
      xaxis: { categories: categorias, labels: { rotate: -45, maxHeight: 60 } }
    }
  }

  function ticketChartOptions(diaria) {
    if (!diaria.length) return null
    const categorias = diaria.map(d => formatarData(d.data))
    const ticket = diaria.map(d => d.pedidos > 0 ? Number((d.receita / d.pedidos).toFixed(2)) : 0)

    return {
      ...chartBase(),
      title: { text: 'Ticket Medio Diario', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [{ name: 'Ticket Medio', data: ticket, color: CORES.warning }],
      xaxis: { categories: categorias, labels: { rotate: -45, maxHeight: 60 } },
      yaxis: { labels: { formatter: v => moeda(v) } }
    }
  }

  function receitaCustoLucroOptions(diaria) {
    if (!diaria.length) return null
    const categorias = diaria.map(d => formatarData(d.data))
    const receita = diaria.map(d => Number(d.receita.toFixed(2)))
    const custo = diaria.map(d => Number(d.custo.toFixed(2)))
    const lucro = diaria.map((d, i) => Number((receita[i] - custo[i]).toFixed(2)))

    return {
      ...chartBase(),
      title: { text: 'Receita x Custo x Lucro', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [
        { name: 'Receita', data: receita, color: CORES.primary },
        { name: 'Custo', data: custo, color: CORES.danger },
        { name: 'Lucro', data: lucro, color: CORES.success }
      ],
      chart: { ...chartBase().chart, type: 'area' },
      fill: { type: 'gradient', gradient: { shadeIntensity: 0.3, opacityFrom: 0.5, opacityTo: 0.1 } },
      xaxis: { categories: categorias, labels: { rotate: -45, maxHeight: 60 } },
      yaxis: { labels: { formatter: v => moeda(v) } }
    }
  }

  function rankingProdutosOptions(ranking) {
    const items = ranking.filter(p => p.nome !== 'Outros').slice(0, 10)
    if (!items.length) return null

    return {
      ...chartBase(),
      title: { text: 'Ranking de Produtos', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [
        { name: 'Receita', data: items.map(p => Number(p.receita.toFixed(2))).reverse(), color: CORES.primary },
        { name: 'Lucro', data: items.map(p => Number(p.lucro.toFixed(2))).reverse(), color: CORES.success }
      ],
      chart: { ...chartBase().chart, type: 'bar' },
      plotOptions: { bar: { borderRadius: 4, horizontal: true } },
      xaxis: { categories: items.map(p => p.nome).reverse(), labels: { formatter: v => moeda(v) } },
      dataLabels: { enabled: true, formatter: v => 'R$ ' + (v / 1000).toFixed(0) + 'k', style: { fontSize: '10px' } }
    }
  }

  function paretoOptions(ranking) {
    const items = ranking.filter(p => p.nome !== 'Outros')
    if (!items.length) return null
    const categorias = items.map(p => p.nome)
    const receita = items.map(p => Number(p.receita.toFixed(2)))
    const total = receita.reduce((s, v) => s + v, 0)
    let acum = 0
    const acumulado = receita.map(v => { acum += v; return Number(((acum / total) * 100).toFixed(1)) })

    return {
      ...chartBase(),
      title: { text: 'Grafico de Pareto - Produtos', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [
        { name: 'Receita', type: 'bar', data: receita, color: CORES.primary },
        { name: '% Acumulado', type: 'line', data: acumulado, color: CORES.danger }
      ],
      stroke: { width: [0, 3] },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
      xaxis: { categories: categorias, labels: { rotate: -45, maxHeight: 60 } },
      yaxis: [
        { labels: { formatter: v => moeda(v) } },
        { opposite: true, max: 100, labels: { formatter: v => v + '%' } }
      ],
      annotations: {
        yaxis: [{ y: 80, strokeDashArray: 4, borderColor: CORES.danger, label: { text: '80%', style: { color: CORES.danger } } }]
      }
    }
  }

  function donutOptions(ranking) {
    const items = ranking.filter(p => p.nome !== 'Outros')
    if (!items.length) return null
    const labels = items.map(p => p.nome)
    const data = items.map(p => Number(p.receita.toFixed(2)))
    const cores = ['#E86E1A', '#1D4ED8', '#2E7D32', '#B45309', '#D94F4F', '#7C3AED', '#0891B2', '#BE185D', '#65A30D', '#D97706']

    return {
      ...chartBase(),
      title: { text: 'Participacao dos Produtos', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: data,
      chart: { ...chartBase().chart, type: 'donut' },
      labels,
      colors: cores,
      legend: { position: 'right', fontSize: '12px' },
      plotOptions: { pie: { donut: { size: '55%' } } },
      tooltip: {
        y: {
          formatter(v, { seriesIndex, w }) {
            const item = items[seriesIndex]
            const pct = ((v / data.reduce((s, d) => s + d, 0)) * 100).toFixed(1)
            return `${moeda(v)} (${pct}%)\nQtd: ${item.quantidade}\nMargem: ${item.margem.toFixed(1)}%`
          }
        }
      },
      dataLabels: { enabled: true, formatter: (v, { seriesIndex }) => items[seriesIndex]?.nome, style: { fontSize: '10px' } }
    }
  }

  function margemOptions(ranking) {
    const items = ranking.filter(p => p.nome !== 'Outros').slice(0, 10)
    if (!items.length) return null
    const margens = items.map(p => Number(p.margem.toFixed(1)))
    const media = margens.reduce((s, v) => s + v, 0) / margens.length
    const cores = margens.map(m => m > media ? CORES.success : m < media * 0.7 ? CORES.danger : CORES.warning)

    return {
      ...chartBase(),
      title: { text: 'Margem por Produto', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [{ name: 'Margem (%)', data: margens, color: CORES.primary }],
      chart: { ...chartBase().chart, type: 'bar' },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%', distributed: true, colors: { ranges: cores.map((c, i) => ({ from: margens[i], to: margens[i], color: c })) } } },
      xaxis: { categories: items.map(p => p.nome), labels: { rotate: -45, maxHeight: 60 } },
      yaxis: { max: 100, labels: { formatter: v => v + '%' } },
      dataLabels: { enabled: true, formatter: v => v + '%', style: { fontSize: '10px' } }
    }
  }

  function clientesOptions(clientes) {
    const items = clientes.filter(c => c.cliente !== 'Outros').slice(0, 10)
    if (!items.length) return null

    return {
      ...chartBase(),
      title: { text: 'Top 10 Clientes', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [
        { name: 'Receita', data: items.map(c => Number(c.receita.toFixed(2))), color: CORES.primary },
        { name: 'Pedidos', data: items.map(c => c.pedidos), color: CORES.info }
      ],
      chart: { ...chartBase().chart, type: 'bar' },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
      xaxis: { categories: items.map(c => c.cliente), labels: { rotate: -45, maxHeight: 60 } },
      yaxis: [
        { labels: { formatter: v => moeda(v) } },
        { opposite: true, labels: { formatter: v => v + ' ped' } }
      ]
    }
  }

  function diaSemanaOptions(vendasPorDiaSemana) {
    if (!vendasPorDiaSemana.length) return null
    const dias = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo']
    const mapa = {}
    vendasPorDiaSemana.forEach(d => { mapa[d.dia] = d })
    const categorias = dias
    const receita = dias.map(d => Number((mapa[d]?.receita || 0).toFixed(2)))
    const pedidos = dias.map(d => mapa[d]?.pedidos || 0)

    return {
      ...chartBase(),
      title: { text: 'Vendas por Dia da Semana', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } },
      series: [
        { name: 'Receita', data: receita, color: CORES.primary },
        { name: 'Pedidos', data: pedidos, color: CORES.info }
      ],
      chart: { ...chartBase().chart, type: 'bar' },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
      xaxis: { categories },
      yaxis: [
        { labels: { formatter: v => moeda(v) } },
        { opposite: true, labels: { formatter: v => v + ' ped' } }
      ]
    }
  }

  function metaGaugeOptions(meta, realizado) {
    const pct = meta > 0 ? Math.min(100, (realizado / meta) * 100) : 0
    const cor = pct >= 100 ? CORES.success : pct >= 70 ? CORES.warning : CORES.danger

    return {
      chart: { ...chartBase().chart, type: 'radialBar' },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          track: { background: CORES.border, startAngle: -135, endAngle: 135 },
          dataLabels: {
            name: { show: true, fontSize: '14px', color: CORES.text },
            value: { show: true, fontSize: '24px', fontWeight: 700, color: cor, formatter: v => v.toFixed(1) + '%' }
          }
        }
      },
      fill: { colors: [cor] },
      series: [Number(pct.toFixed(1))],
      labels: ['Meta Atingida'],
      title: { text: 'Meta do Periodo', align: 'left', style: { fontSize: '14px', fontWeight: 600, color: CORES.text } }
    }
  }

  function exportarPNG(chartRef, titulo) {
    if (!chartRef) return
    chartRef.chart.dataURI().then(({ imgURI }) => {
      const link = document.createElement('a')
      link.href = imgURI
      link.download = `${titulo || 'grafico'}.png`
      link.click()
    })
  }

  function exportarCSV(options, titulo) {
    if (!options || !options.series) return
    const cabecalhos = ['Data', ...options.series.map(s => s.name)]
    const linhas = (options.xaxis?.categories || []).map((cat, i) => {
      return [cat, ...options.series.map(s => s.data[i] || 0)]
    })
    const csv = [cabecalhos.join(','), ...linhas.map(l => l.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${titulo || 'dados'}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return {
    receitaChartOptions, pedidosChartOptions, ticketChartOptions,
    receitaCustoLucroOptions, rankingProdutosOptions, paretoOptions,
    donutOptions, margemOptions, clientesOptions, diaSemanaOptions,
    metaGaugeOptions, exportarPNG, exportarCSV
  }
}

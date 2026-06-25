import { computed } from 'vue'

export function useStatistics(vendasFiltradas, periodoAnterior, vendas, diasDecorridos) {
  const faturamentoPorMes = computed(() => {
    const mapa = {}
    const anoAtual = new Date().getFullYear()
    for (let i = 1; i <= 12; i++) mapa[i] = { realizado: 0, custo: 0 }
    vendas.value.forEach(v => {
      const data = v.data_venda?.split('T')[0]
      if (!data) return
      const d = new Date(data + 'T12:00:00')
      const mes = d.getMonth() + 1
      const ano = d.getFullYear()
      if (ano === anoAtual) {
        mapa[mes].realizado += Number(v.total_final || 0)
        mapa[mes].custo += (v.itens_venda_erp || []).reduce((s, item) =>
          s + ((item.quantidade || 0) * (item.preco_custo || item.produtos_erp?.preco_custo || 0)), 0)
      }
    })
    return mapa
  })

  const kpis = computed(() => {
    const v = vendasFiltradas.value
    const faturamento = v.reduce((s, v) => s + (Number(v.total_final) || 0), 0)
    const custoTotal = v.reduce((s, v) =>
      s + (v.itens_venda_erp || []).reduce((si, item) =>
        si + ((item.quantidade || 0) * (item.preco_custo || item.produtos_erp?.preco_custo || 0)), 0), 0)
    const lucro = faturamento - custoTotal
    const margemLucro = faturamento > 0 ? (lucro / faturamento) * 100 : 0
    const quantidade = v.reduce((s, v) =>
      s + (v.itens_venda_erp || []).reduce((si, item) => si + (item.quantidade || 0), 0), 0)
    const pedidos = v.length
    const ticketMedio = pedidos > 0 ? faturamento / pedidos : 0
    const vendasPorDia = diasDecorridos.value > 0 ? faturamento / diasDecorridos.value : 0

    const anterior = periodoAnterior.value
    const faturamentoAnterior = anterior.reduce((s, v) => s + (Number(v.total_final) || 0), 0)
    const crescimentoFaturamento = faturamentoAnterior > 0
      ? ((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100 : 0

    const mesAtualNum = new Date().getMonth() + 1
    const mesPassadoNum = mesAtualNum === 1 ? 12 : mesAtualNum - 1
    const anoAtual = new Date().getFullYear()
    const anoPassado = mesAtualNum === 1 ? anoAtual - 1 : anoAtual

    const faturamentoMesPassado = vendas.value.filter(v => {
      const data = v.data_venda?.split('T')[0]
      if (!data) return false
      const d = new Date(data + 'T12:00:00')
      return d.getMonth() + 1 === mesPassadoNum && d.getFullYear() === anoPassado
    }).reduce((s, v) => s + (Number(v.total_final) || 0), 0)

    const crescimentoMesAnterior = faturamentoMesPassado > 0
      ? ((faturamentoPorMes.value[mesAtualNum]?.realizado || 0) - faturamentoMesPassado) / faturamentoMesPassado * 100
      : 0

    let maiorVenda = { valor: 0, cliente: '', data: '' }
    let maiorCliente = { nome: '', receita: 0, pedidos: 0 }
    const clientMap = {}
    const prodCount = {}
    const prodLucro = {}

    v.forEach(vv => {
      const val = Number(vv.total_final) || 0
      if (val > maiorVenda.valor) {
        maiorVenda = { valor: val, cliente: vv.cliente || '—', data: vv.data_venda }
      }
      const c = vv.cliente || 'Sem nome'
      if (!clientMap[c]) clientMap[c] = { receita: 0, pedidos: 0 }
      clientMap[c].receita += val
      clientMap[c].pedidos++
      if (clientMap[c].receita > maiorCliente.receita) {
        maiorCliente = { nome: c, ...clientMap[c] }
      }

      ;(vv.itens_venda_erp || []).forEach(item => {
        const nome = item.produtos_erp?.nome || 'Sem nome'
        if (!prodCount[nome]) prodCount[nome] = { qtd: 0, receita: 0, lucro: 0, custo: 0 }
        const qtd = item.quantidade || 0
        const sub = Number(item.subtotal || 0)
        const cust = qtd * (item.preco_custo || item.produtos_erp?.preco_custo || 0)
        prodCount[nome].qtd += qtd
        prodCount[nome].receita += sub
        prodCount[nome].custo += cust
        prodCount[nome].lucro = prodCount[nome].receita - prodCount[nome].custo
      })
    })

    let produtoMaisVendido = { nome: '', qtd: 0 }
    let produtoMaisLucrativo = { nome: '', lucro: 0 }
    Object.entries(prodCount).forEach(([nome, p]) => {
      if (p.qtd > produtoMaisVendido.qtd) produtoMaisVendido = { nome, qtd: p.qtd }
      if (p.lucro > produtoMaisLucrativo.lucro) produtoMaisLucrativo = { nome, lucro: p.lucro }
    })

    const clientesAtivos = Object.keys(clientMap).length
    const novosClientes = Object.entries(clientMap).filter(([, c]) => c.pedidos === 1).length
    const clientesRecorrentes = Object.entries(clientMap).filter(([, c]) => c.pedidos > 1).length
    const produtosAtivos = produtos.value?.filter(p => p.ativo !== false).length || 0
    const diasVendidos = new Set(v.map(vv => vv.data_venda?.split('T')[0]).filter(Boolean)).size
    const lucroDiario = diasDecorridos.value > 0 ? lucro / diasDecorridos.value : 0

    return {
      faturamento, custoTotal, lucro, margemLucro, quantidade, pedidos, ticketMedio,
      vendasPorDia, crescimentoFaturamento, crescimentoMesAnterior,
      maiorVenda, maiorCliente, produtoMaisVendido, produtoMaisLucrativo,
      clientesAtivos, novosClientes, clientesRecorrentes, produtosAtivos,
      diasVendidos, lucroDiario
    }
  })

  const rankingProdutos = computed(() => {
    const mapa = {}
    vendasFiltradas.value.forEach(v => {
      ;(v.itens_venda_erp || []).forEach(item => {
        const nome = item.produtos_erp?.nome || 'Sem nome'
        if (!mapa[nome]) mapa[nome] = { nome, quantidade: 0, receita: 0, custo: 0 }
        const qtd = item.quantidade || 0
        const sub = Number(item.subtotal || 0)
        const custo = qtd * (item.preco_custo || item.produtos_erp?.preco_custo || 0)
        mapa[nome].quantidade += qtd
        mapa[nome].receita += sub
        mapa[nome].custo += custo
      })
    })
    let lista = Object.values(mapa)
      .map(p => ({ ...p, lucro: p.receita - p.custo, margem: p.receita > 0 ? ((p.receita - p.custo) / p.receita) * 100 : 0 }))
      .sort((a, b) => b.receita - a.receita)
    const totalReceita = lista.reduce((s, p) => s + p.receita, 0)
    lista.forEach(p => { p.pctReceita = totalReceita > 0 ? (p.receita / totalReceita) * 100 : 0 })

    if (lista.length > 10) {
      const outros = lista.slice(10)
      const consolidado = {
        nome: 'Outros', quantidade: outros.reduce((s, p) => s + p.quantidade, 0),
        receita: outros.reduce((s, p) => s + p.receita, 0), custo: outros.reduce((s, p) => s + p.custo, 0)
      }
      consolidado.lucro = consolidado.receita - consolidado.custo
      consolidado.margem = consolidado.receita > 0 ? (consolidado.lucro / consolidado.receita) * 100 : 0
      lista = [...lista.slice(0, 10), consolidado]
    }
    return lista
  })

  const rankingClientes = computed(() => {
    const mapa = {}
    vendasFiltradas.value.forEach(v => {
      const nome = v.cliente || 'Sem nome'
      if (!mapa[nome]) mapa[nome] = { cliente: nome, pedidos: 0, receita: 0 }
      mapa[nome].pedidos++
      mapa[nome].receita += Number(v.total_final || 0)
    })
    let lista = Object.values(mapa)
      .map(c => ({ ...c, ticketMedio: c.pedidos > 0 ? c.receita / c.pedidos : 0 }))
      .sort((a, b) => b.receita - a.receita)
    if (lista.length > 10) {
      const outros = lista.slice(10)
      lista = [...lista.slice(0, 10), {
        cliente: 'Outros', pedidos: outros.reduce((s, c) => s + c.pedidos, 0),
        receita: outros.reduce((s, c) => s + c.receita, 0),
        ticketMedio: 0
      }]
      lista[10].ticketMedio = lista[10].pedidos > 0 ? lista[10].receita / lista[10].pedidos : 0
    }
    return lista
  })

  const evolucaoDiaria = computed(() => {
    const mapa = {}
    const dias = []
    vendasFiltradas.value.forEach(v => {
      const data = v.data_venda?.split('T')[0]
      if (!data) return
      if (!mapa[data]) mapa[data] = { data, receita: 0, custo: 0, pedidos: 0, itens: 0 }
      mapa[data].receita += Number(v.total_final || 0)
      mapa[data].custo += (v.itens_venda_erp || []).reduce((s, item) =>
        s + ((item.quantidade || 0) * (item.preco_custo || item.produtos_erp?.preco_custo || 0)), 0)
      mapa[data].pedidos++
      mapa[data].itens += (v.itens_venda_erp || []).reduce((s, item) => s + (item.quantidade || 0), 0)
    })
    Object.keys(mapa).sort().forEach(d => dias.push(mapa[d]))
    return dias
  })

  const vendasPorDiaSemana = computed(() => {
    const dias = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo']
    const mapa = {}
    dias.forEach(d => { mapa[d] = { receita: 0, pedidos: 0 } })
    vendasFiltradas.value.forEach(v => {
      const data = v.data_venda?.split('T')[0]
      if (!data) return
      const d = new Date(data + 'T12:00:00')
      const diaIdx = d.getDay()
      const nome = diaIdx === 0 ? 'Domingo' : dias[diaIdx - 1]
      mapa[nome].receita += Number(v.total_final || 0)
      mapa[nome].pedidos++
    })
    return dias.map(d => ({ dia: d, ...mapa[d] }))
  })

  return {
    kpis, rankingProdutos, rankingClientes, evolucaoDiaria,
    vendasPorDiaSemana, faturamentoPorMes
  }
}

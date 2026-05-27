import * as XLSX from 'xlsx'

export function formatarMoeda(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

export function formatarData(data) {
  if (!data) return '-'
  return data.split('T')[0].split('-').reverse().join('/')
}

export function ratearDesconto(itens, descontoPercentual, totalBruto) {
  if (!itens.length) return []

  const descontoTotal = totalBruto * (descontoPercentual / 100)

  const resultado = []
  let descontoAcumulado = 0

  for (let i = 0; i < itens.length; i++) {
    const item = itens[i]
    const proporcao = item.subtotal / totalBruto

    let valorDesconto
    if (i === itens.length - 1) {
      valorDesconto = Number((descontoTotal - descontoAcumulado).toFixed(2))
    } else {
      valorDesconto = Number((descontoTotal * proporcao).toFixed(2))
    }

    const valorFinal = Number((item.subtotal - valorDesconto).toFixed(2))

    resultado.push({
      ...item,
      valorDesconto: Number(valorDesconto.toFixed(2)),
      valorFinal: Number(valorFinal.toFixed(2))
    })

    descontoAcumulado += valorDesconto
  }

  return resultado
}

export function transformarVendasEmLinhas(vendas) {
  const linhas = []

  for (const venda of vendas) {
    const totalBruto = Number(venda.total_bruto || 0)
    const desconto = Number(venda.desconto || 0)

    const itensRateados = ratearDesconto(venda.itens_venda_erp || [], desconto, totalBruto)

    for (const item of itensRateados) {
      const custoUnitario = item.preco_custo || item.produtos_erp?.preco_custo || 0
      linhas.push({
        data_venda: formatarData(venda.data_venda),
        cliente: venda.cliente || '-',
        produto: item.produtos_erp?.nome || item.nome || '-',
        quantidade: item.quantidade,
        valor_unitario: formatarMoeda(item.preco_unitario),
        valor_unitario_num: Number(item.preco_unitario || 0),
        custo_unitario: formatarMoeda(custoUnitario),
        custo_unitario_num: Number(custoUnitario),
        custo_total: formatarMoeda(custoUnitario * item.quantidade),
        custo_total_num: Number((custoUnitario * item.quantidade).toFixed(2)),
        subtotal_item: formatarMoeda(item.subtotal),
        subtotal_item_num: Number(item.subtotal || 0),
        desconto_percentual: formatarMoeda(desconto),
        desconto_percentual_num: Number(desconto || 0),
        valor_desconto: formatarMoeda(item.valorDesconto),
        valor_desconto_num: Number(item.valorDesconto || 0),
        valor_final_item: formatarMoeda(item.valorFinal),
        valor_final_item_num: Number(item.valorFinal || 0),
        forma_pagamento: venda.forma_pagamento || '-',
        pedido_id: venda.id
      })
    }
  }

  return linhas
}

export function gerarExcel(dados, nomeArquivo = 'relatorio_vendas.xlsx') {
  if (!dados || !dados.length) {
    throw new Error('Nenhum dado para exportar')
  }

  const wsData = [
    [
      'Data',
      'Cliente',
      'Produto',
      'Qtd',
      'Valor Unit.',
      'Custo Unit.',
      'Custo Total',
      'Subtotal',
      'Desc. %',
      'Valor Desc.',
      'Total Item',
      'Pagamento',
      'Pedido ID'
    ]
  ]

  for (const row of dados) {
    wsData.push([
      row.data_venda,
      row.cliente,
      row.produto,
      row.quantidade,
      row.valor_unitario_num,
      row.custo_unitario_num,
      row.custo_total_num,
      row.subtotal_item_num,
      row.desconto_percentual_num / 100,
      row.valor_desconto_num,
      row.valor_final_item_num,
      row.forma_pagamento,
      row.pedido_id
    ])
  }



  const ws = XLSX.utils.aoa_to_sheet(wsData)

  const colWidths = [
    { wch: 12 },
    { wch: 25 },
    { wch: 30 },
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 }
  ]
  ws['!cols'] = colWidths

  ws['!autofilter'] = { ref: `A1:M1` }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Vendas Exportadas')

  const range = XLSX.utils.decode_range(wsData[0] ? `A1:M${wsData.length}` : 'A1:M1')
  ws['!rows'] = [{ hpt: 28 }]

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    if (!ws['!rows']) ws['!rows'] = []
    ws['!rows'].push({ hpt: 22 })
  }

  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
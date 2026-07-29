import { supabase } from '../services/supabase'

function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().split('T')[0]
}

export async function criarLancamentoVenda(venda) {
  const forma = (venda.forma_pagamento || '').toLowerCase()
  const totalFinal = Number(venda.total_final) || 0
  const dataVenda = venda.data_venda?.split('T')[0] || new Date().toISOString().split('T')[0]
  const cliente = venda.cliente || 'Cliente'
  const parcelas = Number(venda.parcelas) || 1

  if (totalFinal <= 0) return

  if (forma === 'credito' || forma === 'cartão de crédito') {
    const valorParcela = Number((totalFinal / parcelas).toFixed(2))

    for (let p = 1; p <= parcelas; p++) {
      const vencimento = addMonths(dataVenda, p - 1)
      await supabase.from('fluxo_caixa_contas_receber').insert([{
        venda_id: venda.id,
        descricao: `Venda #${venda.id} - ${cliente}${parcelas > 1 ? ' (' + p + '/' + parcelas + ')' : ''}`,
        valor: valorParcela,
        parcela: p,
        total_parcelas: parcelas,
        data_vencimento: vencimento,
        status: 'pendente',
        forma_pagamento: venda.forma_pagamento,
      }])
    }
  } else {
    await supabase.from('fluxo_caixa_lancamentos').insert([{
      tipo: 'entrada',
      valor: totalFinal,
      data: dataVenda,
      categoria: 'Vendas',
      descricao: `Venda #${venda.id} - ${cliente}`,
      forma_pagamento: venda.forma_pagamento,
      venda_id: venda.id,
    }])
  }
}

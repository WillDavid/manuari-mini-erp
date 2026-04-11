import { supabase } from './supabase'

export const FORMA_PAGAMENTO_RECEBIDO = ['pix', 'dinheiro']
export const FORMA_PAGAMENTO_PENDENTE = ['credito']

export const STATUS_RECEBIDO = 'recebido'
export const STATUS_PENDENTE = 'pendente'
export const STATUS_PAGO = 'pago'

export function calcularParcelas(valorTotal, numeroParcelas) {
  const valorParcela = valorTotal / numeroParcelas
  return {
    valorParcela: Math.round(valorParcela * 100) / 100,
    valorTotal: valorTotal
  }
}

export function calcularDataVencimento(dataBase, mesesAdicionais) {
  const data = new Date(dataBase)
  data.setMonth(data.getMonth() + mesesAdicionais)
  return data.toISOString()
}

export async function criarContasReceberDaVenda(venda) {
  const {
    id: vendaId,
    data_venda,
    forma_pagamento,
    parcelas,
    valor_parcela,
    total_final: valorTotal
  } = venda

  const recebido = FORMA_PAGAMENTO_RECEBIDO.includes(forma_pagamento)

  if (forma_pagamento === 'credito') {
    const numeroParcelas = parcelas || 1
    const valorParcela = valor_parcela || (valorTotal / numeroParcelas)

    const contas = []
    for (let i = 0; i < numeroParcelas; i++) {
      const dataVencimento = calcularDataVencimento(data_venda, i)

      contas.push({
        venda_id: vendaId,
        valor: valorParcela,
        data_vencimento: dataVencimento,
        status: STATUS_PENDENTE,
        numero_parcela: i + 1,
        total_parcelas: numeroParcelas,
        forma_pagamento: forma_pagamento
      })
    }

    const { data, error } = await supabase
      .from('contas_receber')
      .insert(contas)
      .select()

    if (error) {
      console.error('Erro ao criar contas a receber:', error)
      return null
    }

    return data
  }

  const { data, error } = await supabase
    .from('contas_receber')
    .insert([{
      venda_id: vendaId,
      valor: valorTotal,
      data_vencimento: data_venda,
      status: recebido ? STATUS_RECEBIDO : STATUS_PENDENTE,
      numero_parcela: 1,
      total_parcelas: 1,
      forma_pagamento: forma_pagamento
    }])
    .select()

  if (error) {
    console.error('Erro ao criar conta a receber:', error)
    return null
  }

  return data
}

export async function criarContaPagar(descricao, valor, dataVencimento, formaPagamento = 'transferencia') {
  const payload = {
    descricao,
    valor,
    data_vencimento: dataVencimento,
    forma_pagamento: formaPagamento,
    status: STATUS_PENDENTE
  }

  const { data, error } = await supabase
    .from('contas_pagar')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar conta a pagar:', error)
    return null
  }

  return data
}

export async function buscarContasReceber(vendaId = null) {
  let query = supabase
    .from('contas_receber')
    .select('*')
    .order('data_vencimento', { ascending: true })

  if (vendaId) {
    query = query.eq('venda_id', vendaId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar contas a receber:', error)
    return []
  }

  return data || []
}

export async function buscarContasPagar() {
  const { data, error } = await supabase
    .from('contas_pagar')
    .select('*')
    .order('data_vencimento', { ascending: true })

  if (error) {
    console.error('Erro ao buscar contas a pagar:', error)
    return []
  }

  return data || []
}

export async function atualizarStatusContaReceber(id, novoStatus) {
  const { data, error } = await supabase
    .from('contas_receber')
    .update({ status: novoStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar status:', error)
    return null
  }

  return data
}

export async function atualizarStatusContaPagar(id, novoStatus) {
  const { data, error } = await supabase
    .from('contas_pagar')
    .update({ status: novoStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar status:', error)
    return null
  }

  return data
}

export async function deletarContaReceber(vendaId) {
  const { error } = await supabase
    .from('contas_receber')
    .delete()
    .eq('venda_id', vendaId)

  if (error) {
    console.error('Erro ao deletar contas:', error)
    return false
  }

  return true
}

export async function buscarContasPorVenda(vendaId) {
  return buscarContasReceber(vendaId)
}

export function calcularFluxoCaixa(contasReceber, contasPagar) {
  const entradas = contasReceber
    .filter(c => c.status === STATUS_RECEBIDO)
    .reduce((acc, c) => acc + c.valor, 0)

  const saidas = contasPagar
    .filter(c => c.status === STATUS_PAGO)
    .reduce((acc, c) => acc + c.valor, 0)

  const pendentesReceber = contasReceber
    .filter(c => c.status === STATUS_PENDENTE)
    .reduce((acc, c) => acc + c.valor, 0)

  const pendentesPagar = contasPagar
    .filter(c => c.status === STATUS_PENDENTE)
    .reduce((acc, c) => acc + c.valor, 0)

  return {
    entradas,
    saidas,
    saldoAtual: entradas - saidas,
    pendentesReceber,
    pendentesPagar,
    saldoProjetado: entradas - saidas + pendentesReceber - pendentesPagar,
    totalReceber: entradas + pendentesReceber,
    totalPagar: saidas + pendentesPagar
  }
}

export function formatarMoeda(valor) {
  if (!valor) return '0,00'
  return Number(valor).toFixed(2).replace('.', ',')
}

export function parseMoeda(valor) {
  if (!valor) return 0
  return parseFloat(valor.toString().replace(',', '.')) || 0
}
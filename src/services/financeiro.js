import { supabase } from './supabase'

export const FORMA_PAGAMENTO_RECEBIDO = ['Dinheiro', 'Pix']
export const FORMA_PAGAMENTO_PENDENTE = ['Cartão', 'Cartão de Crédito']

export async function criarContaReceber(vendaId, cliente, valor, formaPagamento, dataVenda) {
  const recebido = FORMA_PAGAMENTO_RECEBIDO.includes(formaPagamento)
  
  const payload = {
    venda_id: vendaId,
    tipo: 'receber',
    descricao: cliente ? `Venda #${vendaId} - ${cliente}` : `Venda #${vendaId}`,
    valor: valor,
    forma_pagamento: formaPagamento,
    data_venda: dataVenda,
    data_vencimento: dataVenda,
    status: recebido ? 'recebido' : 'pendente'
  }

  const { data, error } = await supabase
    .from('contas_financeiro')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar conta a receber:', error)
    return null
  }

  return data
}

export async function criarContaPagar(descricao, valor, dataVencimento, formaPagamento = 'Transferencia') {
  const payload = {
    tipo: 'pagar',
    descricao: descricao,
    valor: valor,
    data_vencimento: dataVencimento,
    forma_pagamento: formaPagamento,
    status: 'pendente'
  }

  const { data, error } = await supabase
    .from('contas_financeiro')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar conta a pagar:', error)
    return null
  }

  return data
}

export async function atualizarStatusConta(id, novoStatus) {
  const { data, error } = await supabase
    .from('contas_financeiro')
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

export async function buscarContas(tipo = null, status = null) {
  let query = supabase
    .from('contas_financeiro')
    .select('*')
    .order('created_at', { ascending: false })

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar contas:', error)
    return []
  }

  return data || []
}

export async function buscarContasReceber(status = null) {
  return buscarContas('receber', status)
}

export async function buscarContasPagar(status = null) {
  return buscarContas('pagar', status)
}

export function calcularFluxoCaixa(contas) {
  const entradas = contas
    .filter(c => c.tipo === 'receber' && c.status === 'recebido')
    .reduce((acc, c) => acc + c.valor, 0)

  const saidas = contas
    .filter(c => c.tipo === 'pagar' && c.status === 'pago')
    .reduce((acc, c) => acc + c.valor, 0)

  const pendentesReceber = contas
    .filter(c => c.tipo === 'receber' && c.status === 'pendente')
    .reduce((acc, c) => acc + c.valor, 0)

  const pendentesPagar = contas
    .filter(c => c.tipo === 'pagar' && c.status === 'pendente')
    .reduce((acc, c) => acc + c.valor, 0)

  return {
    entradas,
    saidas,
    saldoAtual: entradas - saidas,
    pendentesReceber,
    pendentesPagar,
    saldoProjetado: entradas - saidas + pendentesReceber - pendentesPagar
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
import { supabase } from './supabase.js'

/**
 * Produtos
 */
export async function buscarProdutos() {
  const { data, error } = await supabase
    .from('produtos_erp')
    .select('*')
    .order('nome')

  if (error) throw error
  return data || []
}

export async function buscarProdutoPorId(id) {
  const { data, error } = await supabase
    .from('produtos_erp')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function criarProduto(produto) {
  const { data, error } = await supabase
    .from('produtos_erp')
    .insert([produto])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function atualizarProduto(id, produto) {
  const { data, error } = await supabase
    .from('produtos_erp')
    .update(produto)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletarProduto(id) {
  const { error } = await supabase
    .from('produtos_erp')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function atualizarEstoque(id, novoEstoque) {
  const { error } = await supabase
    .from('produtos_erp')
    .update({ estoque: novoEstoque })
    .eq('id', id)

  if (error) throw error
}

export async function buscarEstoqueProduto(id) {
  const { data, error } = await supabase
    .from('produtos_erp')
    .select('estoque')
    .eq('id', id)
    .single()

  if (error) throw error
  return data?.estoque || 0
}

/**
 * Vendas
 */
export async function buscarVendas({ dataInicio, dataFim } = {}) {
  let query = supabase
    .from('vendas_erp')
    .select(`
      *,
      itens_venda_erp (
        id, produto_id, quantidade, preco_unitario, preco_custo, subtotal,
        produtos_erp (nome, preco_custo)
      )
    `)
    .order('data_venda', { ascending: false })

  if (dataInicio && dataFim) {
    query = query
      .gte('data_venda', dataInicio + 'T00:00:00')
      .lte('data_venda', dataFim + 'T23:59:59')
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function criarVenda(venda) {
  const { data, error } = await supabase
    .from('vendas_erp')
    .insert([venda])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function atualizarVenda(id, venda) {
  const { error } = await supabase
    .from('vendas_erp')
    .update(venda)
    .eq('id', id)

  if (error) throw error
}

export async function deletarVenda(id) {
  const { error } = await supabase
    .from('vendas_erp')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function buscarItensVenda(vendaId) {
  const { data, error } = await supabase
    .from('itens_venda_erp')
    .select('*')
    .eq('venda_id', vendaId)

  if (error) throw error
  return data || []
}

export async function criarItensVenda(itens) {
  const { error } = await supabase
    .from('itens_venda_erp')
    .insert(itens)

  if (error) throw error
}

export async function deletarItensVenda(vendaId) {
  const { error } = await supabase
    .from('itens_venda_erp')
    .delete()
    .eq('venda_id', vendaId)

  if (error) throw error
}

/**
 * Estoque — Movimentações
 */
export async function registrarMovimentacao(movimentacao) {
  const { error } = await supabase
    .from('estoque_movimentacoes')
    .insert([movimentacao])

  if (error) throw error
}

/**
 * Vitrine
 */
export async function buscarProdutosVitrine(ordenacao = 'created_at') {
  const campo = ordenacao === 'acessos' ? 'acessos' : 'created_at'
  const { data, error } = await supabase
    .from('vitrine')
    .select(
      '*, vitrine_variacoes(*, vitrine_precos(*), vitrine_precos_faixas(*))',
    )
    .order(campo, { ascending: false })

  if (error) throw error
  return data || []
}

export async function criarProdutoVitrine(produto) {
  const { data, error } = await supabase
    .from('vitrine')
    .insert([produto])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function atualizarProdutoVitrine(id, produto) {
  const { error } = await supabase
    .from('vitrine')
    .update(produto)
    .eq('id', id)

  if (error) throw error
}

export async function deletarProdutoVitrine(id) {
  const { error } = await supabase
    .from('vitrine')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function deletarVariacoes(ids) {
  if (!ids.length) return
  const { error } = await supabase
    .from('vitrine_variacoes')
    .delete()
    .in('id', ids)

  if (error) throw error
}

export async function deletarPrecosPorVariacao(variacaoIds) {
  if (!variacaoIds.length) return
  const { error } = await supabase
    .from('vitrine_precos')
    .delete()
    .in('variacao_id', variacaoIds)

  if (error) throw error
}

export async function deletarFaixasPorVariacao(variacaoIds) {
  if (!variacaoIds.length) return
  const { error } = await supabase
    .from('vitrine_precos_faixas')
    .delete()
    .in('variacao_id', variacaoIds)

  if (error) throw error
}

/**
 * Metas
 */
export async function buscarMetasAno(ano) {
  const { data, error } = await supabase
    .from('metas_mensais')
    .select('*')
    .eq('ano', ano)

  if (error) throw error
  return data || []
}

export async function salvarMeta(ano, mes, valorMeta) {
  const { error } = await supabase
    .from('metas_mensais')
    .upsert(
      { ano, mes, valor_meta: valorMeta },
      { onConflict: 'ano, mes' },
    )

  if (error) throw error
}

/**
 * Utility
 */
export function notificarEstoque() {
  window.dispatchEvent(new Event('estoque-atualizado'))
}

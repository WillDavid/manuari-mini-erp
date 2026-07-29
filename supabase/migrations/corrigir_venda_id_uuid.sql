-- ============================================
-- CORREÇÃO: venda_id de integer para uuid
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. fluxo_caixa_lancamentos: alterar venda_id de integer para uuid
ALTER TABLE fluxo_caixa_lancamentos 
  ALTER COLUMN venda_id TYPE uuid USING venda_id::uuid;

-- 2. fluxo_caixa_contas_receber: alterar venda_id de integer para uuid
ALTER TABLE fluxo_caixa_contas_receber 
  ALTER COLUMN venda_id TYPE uuid USING venda_id::uuid;

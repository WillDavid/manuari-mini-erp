-- ============================================
-- FLUXO DE CAIXA — MIGRAÇÃO ÚNICA
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Saldo Inicial
CREATE TABLE IF NOT EXISTS fluxo_caixa_saldo_inicial (
  id serial PRIMARY KEY,
  valor_inicial numeric(12,2) NOT NULL DEFAULT 0,
  data_referencia date NOT NULL DEFAULT CURRENT_DATE,
  observacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fluxo_caixa_saldo_inicial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tudo_fluxo_caixa_saldo" ON fluxo_caixa_saldo_inicial;
CREATE POLICY "tudo_fluxo_caixa_saldo" ON fluxo_caixa_saldo_inicial FOR ALL USING (true) WITH CHECK (true);

-- 2. Lancamentos
CREATE TABLE IF NOT EXISTS fluxo_caixa_lancamentos (
  id serial PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste_positivo', 'ajuste_negativo')),
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  data date NOT NULL DEFAULT CURRENT_DATE,
  categoria text NOT NULL,
  descricao text,
  forma_pagamento text,
  observacao text,
  venda_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fluxo_caixa_lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tudo_fluxo_caixa_lanc" ON fluxo_caixa_lancamentos;
CREATE POLICY "tudo_fluxo_caixa_lanc" ON fluxo_caixa_lancamentos FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fluxo_caixa_lancamentos' AND column_name = 'venda_id') THEN
    ALTER TABLE fluxo_caixa_lancamentos ADD COLUMN venda_id uuid;
  END IF;
END $$;

-- 3. Contas a Receber
CREATE TABLE IF NOT EXISTS fluxo_caixa_contas_receber (
  id serial PRIMARY KEY,
  venda_id uuid NOT NULL,
  descricao text,
  valor numeric(12,2) NOT NULL,
  parcela integer NOT NULL DEFAULT 1,
  total_parcelas integer NOT NULL DEFAULT 1,
  data_vencimento date NOT NULL,
  data_recebimento date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido')),
  forma_pagamento text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fluxo_caixa_contas_receber ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tudo_fluxo_caixa_contas" ON fluxo_caixa_contas_receber;
CREATE POLICY "tudo_fluxo_caixa_contas" ON fluxo_caixa_contas_receber FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_data ON fluxo_caixa_lancamentos(data);
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_tipo ON fluxo_caixa_lancamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON fluxo_caixa_contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_venda ON fluxo_caixa_contas_receber(venda_id);

-- =====================================================
-- MIGRATIONS: Sistema Financeiro com Parcelamento
-- =====================================================

-- 1) ALTERAR TABELA vendas_erp
-- Adicionar colunas para parcelamento
ALTER TABLE vendas_erp ADD COLUMN IF NOT EXISTS parcelas INT;
ALTER TABLE vendas_erp ADD COLUMN IF NOT EXISTS valor_parcela NUMERIC(12,2);

-- Atualizar registros existentes para null (pagamento à vista)
UPDATE vendas_erp SET parcelas = 1, valor_parcela = total_final WHERE parcelas IS NULL;

-- 2) CRIAR TABELA contas_receber
-- Drop se existir (para recriar limpa)
DROP TABLE IF EXISTS contas_receber CASCADE;

CREATE TABLE contas_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID REFERENCES vendas_erp(id) ON DELETE CASCADE,
    valor NUMERIC(12,2) NOT NULL,
    data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('pendente', 'recebido')) DEFAULT 'pendente',
    numero_parcela INT NOT NULL DEFAULT 1,
    total_parcelas INT NOT NULL DEFAULT 1,
   Forma_pagamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar Índice por venda_id
CREATE INDEX idx_contas_receber_venda_id ON contas_receber(venda_id);
CREATE INDEX idx_contas_receber_status ON contas_receber(status);
CREATE INDEX idx_contas_receber_data_vencimento ON contas_receber(data_vencimento);

-- 3) CRIAR TABELA contas_pagar (despesas manual)
DROP TABLE IF EXISTS contas_pagar CASCADE;

CREATE TABLE contas_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('pendente', 'pago')) DEFAULT 'pendente',
    Forma_pagamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX idx_contas_pagar_data_vencimento ON contas_pagar(data_vencimento);

-- 4) TABELA movimento_financeiro ( histórico completo)
DROP TABLE IF EXISTS movimento_financeiro CASCADE;

CREATE TABLE movimento_financeiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT CHECK (tipo IN ('receita', 'despesa')) NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    Forma_pagamento TEXT,
    status TEXT CHECK (status IN ('pendente', 'recebido', 'pago')) DEFAULT 'pendente',
    origem_type TEXT,
    origem_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_movimento_financeiro_tipo ON movimento_financeiro(tipo);
CREATE INDEX idx_movimento_financeiro_status ON movimento_financeiro(status);

-- =====================================================
-- POLICIES DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimento_financeiro ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (ajuste conforme necessidade)
CREATE POLICY "Permitir tudo em contas_receber" ON contas_receber FOR ALL USING (true);
CREATE POLICY "Permitir tudo em contas_pagar" ON contas_pagar FOR ALL USING (true);
CREATE POLICY "Permitir tudo em movimento_financeiro" ON movimento_financeiro FOR ALL USING (true);
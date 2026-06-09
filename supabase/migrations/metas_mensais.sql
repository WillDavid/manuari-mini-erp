-- Migration: metas_mensais
-- Tabela para armazenar metas de faturamento por mês/ano

CREATE TABLE IF NOT EXISTS metas_mensais (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  valor_meta NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_metas_mensais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER metas_mensais_updated_at
  BEFORE UPDATE ON metas_mensais
  FOR EACH ROW
  EXECUTE FUNCTION update_metas_mensais_updated_at();

-- RLS (opcional, já que a chave anon pode ler/escrever)
ALTER TABLE metas_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo para usuarios autenticados"
  ON metas_mensais
  FOR ALL
  USING (true)
  WITH CHECK (true);

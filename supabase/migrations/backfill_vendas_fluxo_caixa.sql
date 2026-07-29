-- ============================================
-- BACKFILL: gerar contas a receber para vendas
-- a crédito existentes e lancamentos para
-- vendas à vista que não tem registro no caixa
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Para cada venda a crédito sem contas a receber, gerar parcelas
DO $$
DECLARE
  v record;
  parcela_num integer;
  valor_parcela numeric;
  data_vencimento date;
  total_parcelas integer;
BEGIN
  FOR v IN
    SELECT * FROM vendas_erp
    WHERE forma_pagamento = 'Credito'
      AND parcelas > 1
      AND total_final > 0
      AND NOT EXISTS (
        SELECT 1 FROM fluxo_caixa_contas_receber
        WHERE venda_id = vendas_erp.id
      )
  LOOP
    total_parcelas := COALESCE(v.parcelas, 1);
    FOR parcela_num IN 1..total_parcelas LOOP
      data_vencimento := (v.data_venda::date + (30 * parcela_num));
      valor_parcela := ROUND(v.total_final / total_parcelas, 2);
      IF parcela_num = total_parcelas THEN
        valor_parcela := ROUND(v.total_final - (ROUND(v.total_final / total_parcelas, 2) * (total_parcelas - 1)), 2);
      END IF;

      INSERT INTO fluxo_caixa_contas_receber (
        venda_id, descricao, valor, parcela, total_parcelas,
        data_vencimento, status, forma_pagamento
      ) VALUES (
        v.id,
        COALESCE(v.cliente, 'Cliente') || ' — Parcela ' || parcela_num || '/' || total_parcelas,
        valor_parcela,
        parcela_num,
        total_parcelas,
        data_vencimento,
        CASE WHEN data_vencimento <= CURRENT_DATE THEN 'recebido' ELSE 'pendente' END,
        'Cartão de crédito'
      );

      -- Se a parcela já venceu, criar o lançamento no caixa
      IF data_vencimento <= CURRENT_DATE AND NOT EXISTS (
        SELECT 1 FROM fluxo_caixa_lancamentos
        WHERE venda_id = v.id AND descricao LIKE '%Parcela ' || parcela_num || '/' || total_parcelas
      ) THEN
        INSERT INTO fluxo_caixa_lancamentos (
          tipo, valor, data, categoria, descricao, forma_pagamento, venda_id
        ) VALUES (
          'entrada',
          valor_parcela,
          data_vencimento,
          'Vendas',
          COALESCE(v.cliente, 'Cliente') || ' — Parcela ' || parcela_num || '/' || total_parcelas,
          'Cartão de crédito',
          v.id
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 2. Para vendas Pix/Dinheiro sem lançamento no caixa, gerar entrada
INSERT INTO fluxo_caixa_lancamentos (tipo, valor, data, categoria, descricao, forma_pagamento, venda_id)
SELECT
  'entrada',
  ve.total_final,
  ve.data_venda::date,
  'Vendas',
  'Venda — ' || COALESCE(ve.cliente, 'Cliente'),
  ve.forma_pagamento,
  ve.id
FROM vendas_erp ve
WHERE ve.forma_pagamento IN ('Pix', 'Dinheiro')
  AND ve.total_final > 0
  AND NOT EXISTS (
    SELECT 1 FROM fluxo_caixa_lancamentos fl
    WHERE fl.venda_id = ve.id
  );

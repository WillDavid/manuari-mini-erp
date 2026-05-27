-- Adiciona coluna preco_custo na tabela itens_venda_erp
-- para armazenar o custo do produto no momento da venda

ALTER TABLE itens_venda_erp
ADD COLUMN IF NOT EXISTS preco_custo numeric DEFAULT 0;

-- Popular vendas antigas com o custo atual do produto
UPDATE itens_venda_erp i
SET preco_custo = COALESCE(p.preco_custo, 0)
FROM produtos_erp p
WHERE i.produto_id = p.id
  AND (i.preco_custo IS NULL OR i.preco_custo = 0);

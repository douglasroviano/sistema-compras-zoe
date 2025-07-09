-- Definir valor padrão 7% para o campo imposto_percentual
ALTER TABLE produtos_venda 
ALTER COLUMN imposto_percentual SET DEFAULT 7.00;

-- Atualizar registros existentes que não têm imposto definido
UPDATE produtos_venda 
SET imposto_percentual = 7.00 
WHERE imposto_percentual IS NULL;

-- Verificar se a alteração foi aplicada
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'produtos_venda' 
AND column_name = 'imposto_percentual'; 
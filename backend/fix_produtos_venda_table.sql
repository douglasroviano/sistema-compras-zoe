-- =========================================
-- CORREÇÃO TABELA PRODUTOS_VENDA
-- Adicionar campo venda_id se não existir
-- =========================================

-- 1. Verificar se a coluna venda_id existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'produtos_venda' 
        AND column_name = 'venda_id'
    ) THEN
        -- Adicionar coluna venda_id
        ALTER TABLE produtos_venda 
        ADD COLUMN venda_id UUID;
        
        -- Criar índice para performance
        CREATE INDEX idx_produtos_venda_venda_id 
        ON produtos_venda(venda_id);
        
        -- Adicionar constraint de foreign key
        ALTER TABLE produtos_venda 
        ADD CONSTRAINT fk_produtos_venda_venda_id 
        FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Coluna venda_id adicionada com sucesso à tabela produtos_venda';
    ELSE
        RAISE NOTICE 'Coluna venda_id já existe na tabela produtos_venda';
    END IF;
END $$;

-- 2. Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'produtos_venda' 
ORDER BY ordinal_position;

-- 3. Verificar se há produtos órfãos (sem venda_id)
SELECT 
    COUNT(*) as produtos_sem_venda_id
FROM produtos_venda 
WHERE venda_id IS NULL;

-- 4. Mostrar produtos órfãos para análise
SELECT 
    id,
    nome_produto,
    preco_venda,
    venda_id
FROM produtos_venda 
WHERE venda_id IS NULL
LIMIT 10;

-- 5. Verificar relacionamentos
SELECT 
    p.id,
    p.nome_produto,
    p.venda_id,
    v.cliente_telefone,
    c.nome as cliente_nome
FROM produtos_venda p
LEFT JOIN vendas v ON p.venda_id = v.id
LEFT JOIN clientes c ON v.cliente_telefone = c.telefone
ORDER BY p.id
LIMIT 10; 
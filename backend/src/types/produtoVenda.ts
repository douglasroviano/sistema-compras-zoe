export interface ProdutoVenda {
  id?: string;
  venda_id?: string;
  nome_produto: string;
  cor?: string;
  tamanho?: string;
  descricao?: string;
  preco_compra?: number; // Sempre em USD (preço de gôndola)
  preco_venda?: number;  // Sempre em BRL
  quantidade?: number;   // Quantidade do produto na venda
  dolar_agora?: number;  // Cotação no momento da venda
  cotacao_timestamp?: string; // Timestamp automático (NOW())
  imposto_percentual?: number; // Default: 7% (banco de dados)
  foto_url?: string;
  observacoes?: string;
  marca?: string;
} 
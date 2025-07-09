export interface ProdutoVenda {
  id?: string;
  venda_id?: string;
  nome_produto: string;
  cor?: string;
  tamanho?: string;
  descricao?: string;
  preco_compra?: number; // Sempre em USD
  preco_venda?: number;  // Sempre em BRL
  dolar_agora?: number;  // Cotação no momento da venda
  imposto_percentual?: number; // Padrão 7%
  foto_url?: string;
  observacoes?: string;
  marca?: string;
  quantidade?: number;   // Quantidade do produto na venda
  is_novo?: boolean;
  
  // Campos específicos para uso no frontend
  valorTotalUsd?: number;
  valorTotalBrl?: number;
  valorCustoUsd?: number;
  valorCustoBrl?: number;
  lucroUsd?: number;
  lucroBrl?: number;
  margemLucro?: number;
} 
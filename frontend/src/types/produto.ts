export interface Produto {
  id: string;
  venda_id?: string;
  nome_produto: string;
  cor?: string;
  tamanho?: string;
  descricao?: string;
  preco_compra?: number;
  preco_venda?: number;
  foto_url?: string;
  observacoes?: string;
  marca?: string; // Novo campo
  created_at?: string;
}

export interface ProdutoFormData {
  nome_produto: string;
  cor?: string;
  tamanho?: string;
  descricao?: string;
  preco_compra?: number;
  preco_venda?: number;
  foto_url?: string;
  observacoes?: string;
  marca?: string; // Novo campo
} 
export interface Pagamento {
  id: string;
  venda_id: string;
  data_pagamento: string;
  valor: number;
  metodo?: string;
  observacoes?: string;
} 
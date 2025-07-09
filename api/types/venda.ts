export interface Venda {
  id: string;
  cliente_telefone: string;
  data_venda: string;
  data_vencimento?: string;
  metodo_pagamento?: string;
  valor_total?: number;
  valor_pago?: number;
  observacoes?: string;
  status_venda?: string;
} 
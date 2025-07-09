export interface Venda {
  id?: string; // Opcional para criação
  cliente_telefone: string;
  cliente_nome?: string; // Campo calculado do join
  data_venda: string;
  data_vencimento?: string;
  metodo_pagamento?: string;
  valor_total?: number;
  valor_pago?: number;
  status_venda?: 'pendente' | 'despachada' | 'entregue' | 'whatsapp' | 'cancelada';
  total_produtos?: number; // Campo calculado
  observacoes?: string;
} 
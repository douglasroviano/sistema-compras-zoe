export interface Cliente {
  telefone: string; // UUID
  nome: string;
  endereco?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  indicado_por?: string; // telefone do cliente que indicou
  preferencia_entrega?: 'retirada_em_maos' | 'envio_correio';
} 
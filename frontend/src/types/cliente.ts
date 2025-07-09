export interface Cliente {
  telefone: string;
  nome: string;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
  indicado_por?: string;
  preferencia_entrega: string;
  created_at?: string;
} 
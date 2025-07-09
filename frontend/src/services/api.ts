import axios from 'axios';
import type { Cliente } from '../types/cliente';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
});

// Interceptador para adicionar token de autenticação automaticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      return config;
    } catch (error) {
      console.error('Erro ao obter token de autenticação:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido, redirecionar para login
      console.error('Token expirado ou inválido');
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Clientes
export const getClientes = () => api.get('/clientes');
export const getCliente = (telefone: string) => api.get(`/clientes/${telefone}`);
export const createCliente = (cliente: Cliente) => api.post('/clientes', cliente);
export const updateCliente = (telefone: string, cliente: Partial<Cliente>) => api.put(`/clientes/${telefone}`, cliente);
export const deleteCliente = (telefone: string) => api.delete(`/clientes/${telefone}`);

// Vendas
export const getVendas = () => api.get('/vendas');
export const getVenda = (id: string) => api.get(`/vendas/${id}`);
export const createVenda = (venda: any) => api.post('/vendas', venda);
export const updateVenda = (id: string, venda: any) => api.put(`/vendas/${id}`, venda);
export const deleteVenda = (id: string) => api.delete(`/vendas/${id}`);
export const getLucroVendas = () => api.get('/vendas/lucro');

// Produtos
export const getProdutos = () => api.get('/produtos-venda');
export const getProduto = (id: string) => api.get(`/produtos-venda/${id}`);
export const createProduto = (produto: any) => api.post('/produtos-venda', produto);
export const updateProduto = (id: string, produto: any) => api.put(`/produtos-venda/${id}`, produto);
export const deleteProduto = (id: string) => api.delete(`/produtos-venda/${id}`);

// Pagamentos
export const getPagamentos = () => api.get('/pagamentos');
export const getPagamento = (id: string) => api.get(`/pagamentos/${id}`);
export const createPagamento = (pagamento: any) => api.post('/pagamentos', pagamento);
export const updatePagamento = (id: string, pagamento: any) => api.put(`/pagamentos/${id}`, pagamento);
export const deletePagamento = (id: string) => api.delete(`/pagamentos/${id}`);
export const createPagamentoPorCliente = (pagamento: any) => api.post('/pagamentos/por-cliente', pagamento);

// Upload de foto
export const uploadFotoProduto = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/foto-produto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}; 
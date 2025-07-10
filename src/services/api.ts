import axios from 'axios';
import type { Cliente } from '../types/cliente';
import { supabase } from './supabaseClient';

// URL da API baseada no ambiente
const API_URL = '/api';

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
      // NÃO deslogar se for erro na API de lucro (temporário)
      if (error.config?.url?.includes('/vendas/lucro')) {
        console.error('Erro 401 na API de lucro - não deslogando');
        return Promise.reject(error);
      }
      
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
export const getCliente = (telefone: string) => api.get(`/clientes?telefone=${telefone}`);
export const createCliente = (cliente: Omit<Cliente, 'id'>) => api.post('/clientes', cliente);
export const updateCliente = (telefone: string, cliente: Partial<Cliente>) => api.put(`/clientes?telefone=${telefone}`, cliente);
export const deleteCliente = (telefone: string) => api.delete(`/clientes?telefone=${telefone}`);

// Vendas
export const getVendas = () => api.get('/vendas');
export const getVenda = (id: string) => api.get(`/vendas?id=${id}`);
export const createVenda = (venda: any) => api.post('/vendas', venda);
export const updateVenda = (id: string, venda: any) => api.put(`/vendas?id=${id}`, venda);
export const deleteVenda = (id: string) => api.delete(`/vendas?id=${id}`);
export const getLucroVendas = () => api.get('/vendas/lucro');

// Produtos
export const getProdutos = () => api.get('/produtos-venda');
export const getProduto = (id: string) => api.get(`/produtos-venda?id=${id}`);
export const createProduto = (produto: any) => api.post('/produtos-venda', produto);
export const updateProduto = (id: string, produto: any) => api.put(`/produtos-venda?id=${id}`, produto);
export const deleteProduto = (id: string) => api.delete(`/produtos-venda?id=${id}`);

// Pagamentos
export const getPagamentos = () => api.get('/pagamentos');
export const getPagamento = (id: string) => api.get(`/pagamentos?id=${id}`);
export const createPagamento = (pagamento: any) => api.post('/pagamentos', pagamento);
export const updatePagamento = (id: string, pagamento: any) => api.put(`/pagamentos?id=${id}`, pagamento);
export const deletePagamento = (id: string) => api.delete(`/pagamentos?id=${id}`);
export const createPagamentoPorCliente = (pagamento: any) => api.post('/pagamentos/por-cliente', pagamento);

// Upload de foto
export const uploadFotoProduto = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/foto-produto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}; 
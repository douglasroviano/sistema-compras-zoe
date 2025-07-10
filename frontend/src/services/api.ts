import axios from 'axios';
import type { Cliente } from '../types/cliente';

const API_URL = '/api';

// Clientes
export const getClientes = () => axios.get(`${API_URL}/clientes`);
export const getCliente = (telefone: string) => axios.get(`${API_URL}/clientes/${telefone}`);
export const createCliente = (cliente: Cliente) => axios.post(`${API_URL}/clientes`, cliente);
export const updateCliente = (telefone: string, cliente: Partial<Cliente>) => axios.put(`${API_URL}/clientes/${telefone}`, cliente);
export const deleteCliente = (telefone: string) => axios.delete(`${API_URL}/clientes/${telefone}`);

// Upload de foto
export const uploadFotoProduto = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${API_URL}/upload/foto-produto`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}; 
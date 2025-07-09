import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { Cliente } from '../types/cliente';

export const getClientes = async (req: Request, res: Response) => {
  console.log('🔍 Buscando clientes...');
  const { data, error } = await supabase.from('clientes').select('*');
  if (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(500).json({ error: error.message });
    return;
  }
  console.log('✅ Clientes encontrados:', data?.length || 0);
  res.json(data);
};

export const getCliente = async (req: Request, res: Response) => {
  const { telefone } = req.params;
  console.log('🔍 Buscando cliente:', telefone);
  const { data, error } = await supabase.from('clientes').select('*').eq('telefone', telefone).single();
  if (error) {
    console.error('❌ Erro ao buscar cliente:', error);
    res.status(404).json({ error: error.message });
    return;
  }
  console.log('✅ Cliente encontrado:', data);
  res.json(data);
};

export const createCliente = async (req: Request, res: Response) => {
  console.log('🚀 === INÍCIO DA REQUISIÇÃO DE CRIAÇÃO DE CLIENTE ===');
  console.log('📝 Body recebido:', JSON.stringify(req.body, null, 2));
  
  const cliente: Cliente = req.body;
  console.log('💾 Tentando criar cliente:', cliente);
  
  // Validação básica
  if (!cliente.telefone || !cliente.nome) {
    console.error('❌ Dados obrigatórios faltando:', { telefone: cliente.telefone, nome: cliente.nome });
    res.status(400).json({ error: 'Telefone e nome são obrigatórios' });
    return;
  }
  
  try {
    console.log('🔄 Chamando Supabase insert...');
    const { data, error } = await supabase.from('clientes').insert([cliente]).select().single();
    
    if (error) {
      console.error('❌ Erro do Supabase:', JSON.stringify(error, null, 2));
      res.status(400).json({ error: error.message, details: error });
      return;
    }
    
    console.log('✅ Cliente criado com sucesso:', JSON.stringify(data, null, 2));
    console.log('🚀 === FIM DA REQUISIÇÃO - SUCESSO ===');
    res.status(201).json(data);
  } catch (err) {
    console.error('❌ Erro geral:', err);
    console.log('🚀 === FIM DA REQUISIÇÃO - ERRO ===');
    res.status(500).json({ error: 'Erro interno do servidor', details: err });
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  const { telefone } = req.params;
  const cliente: Partial<Cliente> = req.body;
  console.log('📝 Atualizando cliente:', telefone, cliente);
  
  const { data, error } = await supabase.from('clientes').update(cliente).eq('telefone', telefone).select().single();
  if (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    res.status(400).json({ error: error.message });
    return;
  }
  console.log('✅ Cliente atualizado:', data);
  res.json(data);
};

export const deleteCliente = async (req: Request, res: Response) => {
  const { telefone } = req.params;
  console.log('🗑️ Deletando cliente:', telefone);
  
  const { error } = await supabase.from('clientes').delete().eq('telefone', telefone);
  if (error) {
    console.error('❌ Erro ao deletar cliente:', error);
    res.status(400).json({ error: error.message });
    return;
  }
  console.log('✅ Cliente deletado');
  res.status(204).send();
}; 
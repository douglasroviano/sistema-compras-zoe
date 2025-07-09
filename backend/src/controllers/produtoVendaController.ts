import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { ProdutoVenda } from '../types/produtoVenda';
import { CotacaoService } from '../services/cotacaoService';

export const getProdutosVenda = async (req: Request, res: Response) => {
  const { venda_id } = req.query;
  
  let query = supabase.from('produtos_venda').select('*');
  
  // Se venda_id foi passado como query parameter, filtrar
  if (venda_id) {
    query = query.eq('venda_id', venda_id as string);
  }
  
  const { data, error } = await query;
  
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
};

export const getProdutoVenda = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('produtos_venda').select('*').eq('id', id).single();
  if (error) {
    res.status(404).json({ error: error.message });
    return;
  }
  res.json(data);
};

export const createProdutoVenda = async (req: Request, res: Response) => {
  try {
    const produto: ProdutoVenda = req.body;
    
    // Salvar produto como recebido, sem modificações
    const { data, error } = await supabase.from('produtos_venda').insert([produto]).select().single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateProdutoVenda = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const produto: Partial<ProdutoVenda> = req.body;
    
    // Atualizar produto como recebido, sem modificações
    const { data, error } = await supabase.from('produtos_venda').update(produto).eq('id', id).select().single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteProdutoVenda = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('produtos_venda').delete().eq('id', id);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(204).send();
};

export const getCotacaoDolar = async (req: Request, res: Response) => {
  try {
    const cotacao = await CotacaoService.obterCotacaoDolar();
    
    // Data/hora automática como =NOW() do Excel
    const agora = new Date();
    const timestampBrasil = agora.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    res.json({ 
      cotacao,
      timestamp: agora.toISOString(), // Para sistemas
      timestamp_brasil: timestampBrasil, // Para exibição
      fonte: 'AwesomeAPI'
    });
  } catch (error) {
    console.error('Erro ao obter cotação:', error);
    res.status(500).json({ error: 'Erro ao obter cotação do dólar' });
  }
}; 
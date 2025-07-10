import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { ProdutoVenda } from '../types/produtoVenda';
import { CotacaoService } from '../services/cotacaoService';

export const getProdutosVenda = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('produtos_venda').select('*');
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
  const produto: ProdutoVenda = req.body;
  const { data, error } = await supabase.from('produtos_venda').insert([produto]).select().single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
};

export const updateProdutoVenda = async (req: Request, res: Response) => {
  const { id } = req.params;
  const produto: Partial<ProdutoVenda> = req.body;
  const { data, error } = await supabase.from('produtos_venda').update(produto).eq('id', id).select().single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json(data);
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
    res.json({
      cotacao,
      fonte: 'AwesomeAPI',
      atualizado_em: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cotação do dólar' });
  }
}; 
import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { Pagamento } from '../types/pagamento';

// Função para recalcular o valor_pago de uma venda baseado na soma dos pagamentos
const recalcularValorPago = async (vendaId: string) => {
  const { data: pagamentos } = await supabase
    .from('pagamentos')
    .select('valor')
    .eq('venda_id', vendaId);

  const valorTotalPago = pagamentos?.reduce((sum, p) => sum + p.valor, 0) || 0;

  await supabase
    .from('vendas')
    .update({ valor_pago: valorTotalPago })
    .eq('id', vendaId);

  return valorTotalPago;
};

export const getPagamentos = async (req: Request, res: Response) => {
  try {
    // Buscar pagamentos
    const { data: pagamentos, error: pagamentosError } = await supabase
      .from('pagamentos')
      .select('*');
    
    if (pagamentosError) {
      res.status(500).json({ error: pagamentosError.message });
      return;
    }

    // Buscar vendas
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select(`
        id,
        cliente_telefone,
        valor_total,
        valor_pago,
        clientes(nome, telefone)
      `);

    if (vendasError) {
      res.status(500).json({ error: vendasError.message });
      return;
    }

    // Combinar os dados
    const pagamentosComDetalhes = pagamentos?.map(pagamento => {
      const venda = vendas?.find(v => v.id === pagamento.venda_id);
      const cliente = Array.isArray(venda?.clientes) ? venda?.clientes[0] : venda?.clientes;
      return {
        ...pagamento,
        cliente_nome: cliente?.nome,
        cliente_telefone: cliente?.telefone,
        venda_valor_total: venda?.valor_total,
        venda_valor_pago: venda?.valor_pago
      };
    });

    res.json(pagamentosComDetalhes || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getPagamento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('pagamentos').select('*').eq('id', id).single();
  if (error) {
    res.status(404).json({ error: error.message });
    return;
  }
  res.json(data);
};

export const createPagamento = async (req: Request, res: Response) => {
  try {
    const pagamento: Pagamento = req.body;
    const { data, error } = await supabase.from('pagamentos').insert([pagamento]).select().single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Recalcular o valor_pago da venda
    if (data.venda_id) {
      await recalcularValorPago(data.venda_id);
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updatePagamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pagamento: Partial<Pagamento> = req.body;
    
    // Buscar o pagamento atual para obter o venda_id
    const { data: pagamentoAtual } = await supabase
      .from('pagamentos')
      .select('venda_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase.from('pagamentos').update(pagamento).eq('id', id).select().single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Recalcular o valor_pago da venda
    if (pagamentoAtual?.venda_id) {
      await recalcularValorPago(pagamentoAtual.venda_id);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deletePagamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Buscar o pagamento antes de excluir para obter o venda_id
    const { data: pagamento } = await supabase
      .from('pagamentos')
      .select('venda_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('pagamentos').delete().eq('id', id);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Recalcular o valor_pago da venda após excluir o pagamento
    if (pagamento?.venda_id) {
      await recalcularValorPago(pagamento.venda_id);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 
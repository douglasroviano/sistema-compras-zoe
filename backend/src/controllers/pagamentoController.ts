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

    // Buscar vendas (igual ao controller de vendas)
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('*');

    console.log('🔍 Debug vendas do backend:', vendas?.map(v => ({
      id: v.id.substring(0, 8),
      data_vencimento: v.data_vencimento,
      valor_total: v.valor_total
    })));

    // Buscar clientes separadamente
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('telefone, nome');

    if (vendasError) {
      res.status(500).json({ error: vendasError.message });
      return;
    }

    if (clientesError) {
      res.status(500).json({ error: clientesError.message });
      return;
    }

    // Combinar os dados (igual ao controller de vendas)
    const pagamentosComDetalhes = pagamentos?.map(pagamento => {
      const venda = vendas?.find(v => v.id === pagamento.venda_id);
      const cliente = clientes?.find(c => c.telefone === venda?.cliente_telefone);
      
      console.log('🔍 Debug combinação:', {
        pagamentoId: pagamento.id.substring(0, 8),
        vendaId: venda?.id.substring(0, 8),
        dataVencimento: venda?.data_vencimento
      });
      
      return {
        ...pagamento,
        cliente_nome: cliente?.nome || 'Cliente não encontrado',
        cliente_telefone: cliente?.telefone,
        venda_valor_total: venda?.valor_total,
        venda_valor_pago: venda?.valor_pago,
        venda_data_vencimento: venda?.data_vencimento
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

// Novo endpoint: Pagamento por Cliente com distribuição automática
export const createPagamentoPorCliente = async (req: Request, res: Response) => {
  try {
    const { cliente_telefone, valor, metodo, data_pagamento, observacoes } = req.body;

    if (!cliente_telefone || !valor || valor <= 0) {
      res.status(400).json({ error: 'Cliente e valor são obrigatórios' });
      return;
    }

    console.log('🔄 Iniciando pagamento por cliente:', {
      cliente_telefone,
      valor,
      metodo,
      data_pagamento
    });

    // 1. Buscar todas as vendas pendentes do cliente (ordenadas por data - FIFO)
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('id, valor_total, valor_pago, data_venda, status_venda')
      .eq('cliente_telefone', cliente_telefone)
      .neq('status_venda', 'cancelada')
      .order('data_venda', { ascending: true }); // FIFO - mais antigas primeiro

    if (vendasError) {
      res.status(500).json({ error: vendasError.message });
      return;
    }

    if (!vendas || vendas.length === 0) {
      res.status(400).json({ error: 'Cliente não possui vendas pendentes' });
      return;
    }

    // 2. Filtrar apenas vendas que ainda têm valor pendente
    const vendasPendentes = vendas.filter(venda => {
      const valorDevendo = (venda.valor_total || 0) - (venda.valor_pago || 0);
      return valorDevendo > 0;
    });

    if (vendasPendentes.length === 0) {
      res.status(400).json({ error: 'Cliente não possui valores pendentes' });
      return;
    }

    console.log('💰 Vendas pendentes encontradas:', vendasPendentes.map(v => ({
      id: v.id.substring(0, 8),
      valorDevendo: (v.valor_total || 0) - (v.valor_pago || 0)
    })));

    // 3. Distribuir o valor entre as vendas (FIFO)
    let valorRestante = valor;
    const pagamentosParaCriar = [];
    const vendasAtualizadas = [];

    for (const venda of vendasPendentes) {
      if (valorRestante <= 0) break;

      const valorDevendo = (venda.valor_total || 0) - (venda.valor_pago || 0);
      const valorParaEstaVenda = Math.min(valorRestante, valorDevendo);

      // Criar registro de pagamento para esta venda
      const novoPagamento = {
        venda_id: venda.id,
        valor: valorParaEstaVenda,
        metodo: metodo || 'Não informado',
        data_pagamento: data_pagamento || new Date().toISOString().split('T')[0],
        observacoes: observacoes || `Pagamento automático por cliente - Distribuição: R$ ${valorParaEstaVenda.toFixed(2)}`
      };

      pagamentosParaCriar.push(novoPagamento);
      vendasAtualizadas.push(venda.id);
      valorRestante -= valorParaEstaVenda;

      console.log(`💳 Distribuindo R$ ${valorParaEstaVenda.toFixed(2)} para venda ${venda.id.substring(0, 8)}`);
    }

    // 4. Criar os pagamentos no banco
    const { data: pagamentosCriados, error: pagamentosError } = await supabase
      .from('pagamentos')
      .insert(pagamentosParaCriar)
      .select();

    if (pagamentosError) {
      res.status(500).json({ error: 'Erro ao criar pagamentos: ' + pagamentosError.message });
      return;
    }

    // 5. Recalcular valor_pago para cada venda afetada
    const resultadosAtualizacao = [];
    for (const vendaId of vendasAtualizadas) {
      const valorPagoAtualizado = await recalcularValorPago(vendaId);
      resultadosAtualizacao.push({
        venda_id: vendaId,
        novo_valor_pago: valorPagoAtualizado
      });
    }

    // 6. Verificar se sobrou valor (cliente pagou mais que devia)
    const valorSobra = valorRestante;

    console.log('✅ Pagamento distribuído com sucesso:', {
      pagamentosCriados: pagamentosCriados?.length,
      vendasAfetadas: vendasAtualizadas.length,
      valorSobra: valorSobra
    });

    // Resposta detalhada
    res.status(201).json({
      success: true,
      message: 'Pagamento distribuído automaticamente',
      detalhes: {
        valor_total_pago: valor,
        valor_distribuido: valor - valorSobra,
        valor_sobra: valorSobra,
        vendas_afetadas: vendasAtualizadas.length,
        pagamentos_criados: pagamentosCriados?.length
      },
      pagamentos: pagamentosCriados,
      vendas_atualizadas: resultadosAtualizacao
    });

  } catch (error) {
    console.error('Erro ao criar pagamento por cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 
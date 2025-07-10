import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { Venda } from '../types/venda';

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

export const getVendas = async (req: Request, res: Response) => {
  try {
    // Buscar vendas
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('*');
    
    if (vendasError) {
      res.status(500).json({ error: vendasError.message });
      return;
    }

    // Buscar clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('telefone, nome');

    if (clientesError) {
      res.status(500).json({ error: clientesError.message });
      return;
    }

    // Combinar os dados
    const vendasComClientes = vendas?.map(venda => {
      const cliente = clientes?.find(c => c.telefone === venda.cliente_telefone);
      return {
        ...venda,
        cliente_nome: cliente?.nome || 'Cliente não encontrado'
      };
    });

    res.json(vendasComClientes || []);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getVenda = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('vendas').select('*').eq('id', id).single();
  if (error) {
    res.status(404).json({ error: error.message });
    return;
  }
  res.json(data);
};

export const createVenda = async (req: Request, res: Response) => {
  try {
    const vendaData: Venda = req.body;
    const valorEntrada = vendaData.valor_pago || 0;
    
    // Criar a venda SEM valor_pago inicialmente (será calculado após os pagamentos)
    const vendaParaCriar = {
      ...vendaData,
      valor_pago: 0 // Sempre inicia com 0, será atualizado após criar pagamentos
    };
    
    const { data: vendaCriada, error: vendaError } = await supabase
      .from('vendas')
      .insert([vendaParaCriar])
      .select()
      .single();
    
    if (vendaError) {
      res.status(400).json({ error: vendaError.message });
      return;
    }

    // Se há valor de entrada, criar o registro de pagamento PRIMEIRO
    if (valorEntrada > 0) {
      // Extrair método de pagamento do campo metodo_pagamento
      let metodoPagamento = 'dinheiro'; // padrão
      if (vendaData.metodo_pagamento) {
        if (vendaData.metodo_pagamento.toLowerCase().includes('pix')) {
          metodoPagamento = 'pix';
        } else if (vendaData.metodo_pagamento.toLowerCase().includes('cartao') || vendaData.metodo_pagamento.toLowerCase().includes('cartão')) {
          metodoPagamento = 'cartao';
        } else if (vendaData.metodo_pagamento.toLowerCase().includes('transferencia') || vendaData.metodo_pagamento.toLowerCase().includes('transferência')) {
          metodoPagamento = 'transferencia';
        }
      }

      const pagamento = {
        venda_id: vendaCriada.id,
        valor: valorEntrada,
        metodo: metodoPagamento,
        data_pagamento: vendaData.data_venda || new Date().toISOString().split('T')[0],
        observacoes: `Pagamento de entrada - ${vendaData.metodo_pagamento || 'Método não especificado'}`
      };

      const { error: pagamentoError } = await supabase
        .from('pagamentos')
        .insert([pagamento]);

      if (pagamentoError) {
        console.error('Erro ao criar pagamento automático:', pagamentoError.message);
        res.status(400).json({ error: 'Erro ao criar pagamento de entrada' });
        return;
      }

      // Recalcular o valor_pago da venda baseado nos pagamentos
      await recalcularValorPago(vendaCriada.id);

      // Buscar a venda atualizada para retornar
      const { data: vendaAtualizada } = await supabase
        .from('vendas')
        .select('*')
        .eq('id', vendaCriada.id)
        .single();

      res.status(201).json(vendaAtualizada || vendaCriada);
    } else {
      res.status(201).json(vendaCriada);
    }
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateVenda = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendaData: Partial<Venda> = req.body;
    
    // IMPORTANTE: Separar valor_pago dos outros dados
    // O valor_pago não deve ser atualizado diretamente na tabela vendas
    const { valor_pago: valorPagoInformado, ...dadosParaAtualizar } = vendaData;

    // Atualizar apenas os dados que não sejam valor_pago
    const { data: vendaAtualizada, error: updateError } = await supabase
      .from('vendas')
      .update(dadosParaAtualizar)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      res.status(400).json({ error: updateError.message });
      return;
    }

    // Se foi informado um valor_pago, criar pagamento adicional se necessário
    if (valorPagoInformado !== undefined && valorPagoInformado > 0) {
      // Calcular o valor atual já pago (soma dos pagamentos existentes)
      const valorAtualPago = await recalcularValorPago(id);
      
      // Se o valor informado é maior que o já pago, criar pagamento adicional
      if (valorPagoInformado > valorAtualPago) {
        const valorAdicional = valorPagoInformado - valorAtualPago;
        
        // Extrair método de pagamento
        let metodoPagamento = 'dinheiro';
        const metodoTexto = vendaData.metodo_pagamento || '';
        
        if (metodoTexto.toLowerCase().includes('pix')) {
          metodoPagamento = 'pix';
        } else if (metodoTexto.toLowerCase().includes('cartao') || metodoTexto.toLowerCase().includes('cartão')) {
          metodoPagamento = 'cartao';
        } else if (metodoTexto.toLowerCase().includes('transferencia') || metodoTexto.toLowerCase().includes('transferência')) {
          metodoPagamento = 'transferencia';
        }

        const pagamento = {
          venda_id: id,
          valor: valorAdicional,
          metodo: metodoPagamento,
          data_pagamento: new Date().toISOString().split('T')[0],
          observacoes: `Pagamento adicional - ${metodoTexto || 'Método não especificado'}`
        };

        const { error: pagamentoError } = await supabase
          .from('pagamentos')
          .insert([pagamento]);

        if (pagamentoError) {
          console.error('Erro ao criar pagamento adicional:', pagamentoError.message);
        } else {
          // Recalcular o valor_pago após inserir o novo pagamento
          await recalcularValorPago(id);
        }
      }
    }

    // Buscar a venda final com o valor_pago atualizado
    const { data: vendaFinal } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', id)
      .single();

    res.json(vendaFinal || vendaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteVenda = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('vendas').delete().eq('id', id);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(204).send();
}; 
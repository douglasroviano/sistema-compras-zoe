"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendaComProdutos = exports.createVendaComProdutos = exports.getLucroVendas = exports.deleteVenda = exports.updateVenda = exports.createVenda = exports.getVenda = exports.getVendas = void 0;
const supabaseClient_1 = require("../services/supabaseClient");
// Função para recalcular o valor_pago de uma venda baseado na soma dos pagamentos
const recalcularValorPago = async (vendaId) => {
    const { data: pagamentos } = await supabaseClient_1.supabase
        .from('pagamentos')
        .select('valor')
        .eq('venda_id', vendaId);
    const valorTotalPago = pagamentos?.reduce((sum, p) => sum + p.valor, 0) || 0;
    await supabaseClient_1.supabase
        .from('vendas')
        .update({ valor_pago: valorTotalPago })
        .eq('id', vendaId);
    return valorTotalPago;
};
const getVendas = async (req, res) => {
    try {
        // Buscar vendas
        const { data: vendas, error: vendasError } = await supabaseClient_1.supabase
            .from('vendas')
            .select('*');
        if (vendasError) {
            res.status(500).json({ error: vendasError.message });
            return;
        }
        // Buscar clientes
        const { data: clientes, error: clientesError } = await supabaseClient_1.supabase
            .from('clientes')
            .select('telefone, nome');
        if (clientesError) {
            res.status(500).json({ error: clientesError.message });
            return;
        }
        // Buscar produtos de todas as vendas
        const { data: todosProdutos, error: produtosError } = await supabaseClient_1.supabase
            .from('produtos_venda')
            .select('*');
        if (produtosError) {
            res.status(500).json({ error: produtosError.message });
            return;
        }
        // Buscar todos os pagamentos para recalcular valores pagos corretamente
        const { data: todosPagamentos, error: pagamentosError } = await supabaseClient_1.supabase
            .from('pagamentos')
            .select('*');
        if (pagamentosError) {
            res.status(500).json({ error: pagamentosError.message });
            return;
        }
        // Combinar os dados
        const vendasComClientes = vendas?.map(venda => {
            const cliente = clientes?.find(c => c.telefone === venda.cliente_telefone);
            // Calcular valor pago real da tabela pagamentos
            const pagamentosVenda = todosPagamentos?.filter(p => p.venda_id === venda.id) || [];
            const valorPagoReal = pagamentosVenda.reduce((sum, p) => sum + p.valor, 0);
            // Buscar produtos desta venda e mapear para o formato esperado pelo frontend
            const produtosVenda = todosProdutos?.filter(p => p.venda_id === venda.id) || [];
            const totalProdutos = produtosVenda.length;
            // Mapear produtos para o formato que o frontend espera
            const produtosFormatados = produtosVenda.map(produto => ({
                nome_produto: produto.nome_produto,
                marca: produto.marca,
                quantidade: produto.quantidade || 1
            }));
            return {
                ...venda,
                cliente_nome: cliente?.nome || 'Cliente não encontrado',
                valor_pago: valorPagoReal, // Sobrescrever com valor real da tabela pagamentos
                total_produtos: totalProdutos,
                produtos: produtosFormatados // Produtos formatados para o frontend
            };
        });
        res.json(vendasComClientes || []);
    }
    catch (error) {
        console.error('Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getVendas = getVendas;
const getVenda = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabaseClient_1.supabase.from('vendas').select('*').eq('id', id).single();
    if (error) {
        res.status(404).json({ error: error.message });
        return;
    }
    res.json(data);
};
exports.getVenda = getVenda;
const createVenda = async (req, res) => {
    try {
        const vendaData = req.body;
        const valorEntrada = vendaData.valor_pago || 0;
        // Criar a venda SEM valor_pago inicialmente (será calculado após os pagamentos)
        const vendaParaCriar = {
            ...vendaData,
            valor_pago: 0 // Sempre inicia com 0, será atualizado após criar pagamentos
        };
        const { data: vendaCriada, error: vendaError } = await supabaseClient_1.supabase
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
                }
                else if (vendaData.metodo_pagamento.toLowerCase().includes('cartao') || vendaData.metodo_pagamento.toLowerCase().includes('cartão')) {
                    metodoPagamento = 'cartao';
                }
                else if (vendaData.metodo_pagamento.toLowerCase().includes('transferencia') || vendaData.metodo_pagamento.toLowerCase().includes('transferência')) {
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
            const { error: pagamentoError } = await supabaseClient_1.supabase
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
            const { data: vendaAtualizada } = await supabaseClient_1.supabase
                .from('vendas')
                .select('*')
                .eq('id', vendaCriada.id)
                .single();
            res.status(201).json(vendaAtualizada || vendaCriada);
        }
        else {
            res.status(201).json(vendaCriada);
        }
    }
    catch (error) {
        console.error('Erro ao criar venda:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.createVenda = createVenda;
const updateVenda = async (req, res) => {
    try {
        const { id } = req.params;
        const vendaData = req.body; // Usar any para permitir metodo_entrega
        // IMPORTANTE: Separar valor_pago e metodo_entrega dos dados para atualizar vendas
        // O valor_pago não deve ser atualizado diretamente na tabela vendas
        // O metodo_entrega não existe na tabela vendas, vai para clientes
        const { valor_pago: valorPagoInformado, metodo_entrega, ...dadosParaAtualizar } = vendaData;
        // Atualizar apenas os dados que existem na tabela vendas (observacoes, status_venda, etc.)
        const { data: vendaAtualizada, error: updateError } = await supabaseClient_1.supabase
            .from('vendas')
            .update(dadosParaAtualizar)
            .eq('id', id)
            .select()
            .single();
        if (updateError) {
            res.status(400).json({ error: updateError.message });
            return;
        }
        // Se foi informado um metodo_entrega, atualizar a preferencia_entrega do cliente
        if (metodo_entrega && vendaData.cliente_telefone) {
            try {
                await supabaseClient_1.supabase
                    .from('clientes')
                    .update({ preferencia_entrega: metodo_entrega })
                    .eq('telefone', vendaData.cliente_telefone);
            }
            catch (error) {
                console.error('Erro ao atualizar preferência de entrega do cliente:', error);
                // Não falhar a requisição se der erro ao atualizar cliente
            }
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
                }
                else if (metodoTexto.toLowerCase().includes('cartao') || metodoTexto.toLowerCase().includes('cartão')) {
                    metodoPagamento = 'cartao';
                }
                else if (metodoTexto.toLowerCase().includes('transferencia') || metodoTexto.toLowerCase().includes('transferência')) {
                    metodoPagamento = 'transferencia';
                }
                const pagamento = {
                    venda_id: id,
                    valor: valorAdicional,
                    metodo: metodoPagamento,
                    data_pagamento: new Date().toISOString().split('T')[0],
                    observacoes: `Pagamento adicional - ${metodoTexto || 'Método não especificado'}`
                };
                const { error: pagamentoError } = await supabaseClient_1.supabase
                    .from('pagamentos')
                    .insert([pagamento]);
                if (pagamentoError) {
                    console.error('Erro ao criar pagamento adicional:', pagamentoError.message);
                }
                else {
                    // Recalcular o valor_pago após inserir o novo pagamento
                    await recalcularValorPago(id);
                }
            }
        }
        // Buscar a venda final com o valor_pago atualizado
        const { data: vendaFinal } = await supabaseClient_1.supabase
            .from('vendas')
            .select('*')
            .eq('id', id)
            .single();
        res.json(vendaFinal || vendaAtualizada);
    }
    catch (error) {
        console.error('Erro ao atualizar venda:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.updateVenda = updateVenda;
const deleteVenda = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseClient_1.supabase.from('vendas').delete().eq('id', id);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.status(204).send();
};
exports.deleteVenda = deleteVenda;
// Nova função para calcular lucro das vendas
const getLucroVendas = async (req, res) => {
    try {
        // Buscar todas as vendas
        const { data: vendas, error: vendasError } = await supabaseClient_1.supabase
            .from('vendas')
            .select('*');
        if (vendasError) {
            res.status(500).json({ error: vendasError.message });
            return;
        }
        // Buscar todos os produtos das vendas
        const { data: produtos, error: produtosError } = await supabaseClient_1.supabase
            .from('produtos_venda')
            .select('*');
        if (produtosError) {
            res.status(500).json({ error: produtosError.message });
            return;
        }
        let lucroTotalUSD = 0;
        let lucroTotalBRL = 0;
        let custoTotalUSD = 0;
        let custoTotalBRL = 0;
        let vendaTotalBRL = 0;
        let vendaTotalUSD = 0; // Nova variável para faturamento em USD
        // Calcular lucro por venda
        vendas?.forEach(venda => {
            const produtosDaVenda = produtos?.filter(p => p.venda_id === venda.id);
            produtosDaVenda?.forEach(produto => {
                const precoGondolaUSD = produto.preco_compra || 0; // Agora é valor de gôndola
                const precoVendaBRL = produto.preco_venda || 0;
                const impostoPercentual = produto.imposto_percentual || 7;
                const cotacao = produto.dolar_agora || 5.20;
                // Calcular custo real (gôndola + imposto)
                const custoRealUSD = precoGondolaUSD * (1 + impostoPercentual / 100);
                const custoRealBRL = custoRealUSD * cotacao;
                // Calcular faturamento em USD (usando a cotação do produto)
                const vendaUSD = precoVendaBRL / cotacao;
                // Calcular lucro
                const lucroBRL = precoVendaBRL - custoRealBRL;
                const lucroUSD = lucroBRL / cotacao;
                // Somar totais
                custoTotalUSD += custoRealUSD;
                custoTotalBRL += custoRealBRL;
                vendaTotalBRL += precoVendaBRL;
                vendaTotalUSD += vendaUSD; // Faturamento total em USD
                lucroTotalUSD += lucroUSD;
                lucroTotalBRL += lucroBRL;
            });
        });
        // Calcular margens
        const margemPercentual = vendaTotalBRL > 0 ? (lucroTotalBRL / vendaTotalBRL) * 100 : 0;
        const resultado = {
            lucroTotalUSD: Number(lucroTotalUSD.toFixed(2)),
            lucroTotalBRL: Number(lucroTotalBRL.toFixed(2)),
            custoTotalUSD: Number(custoTotalUSD.toFixed(2)),
            custoTotalBRL: Number(custoTotalBRL.toFixed(2)),
            vendaTotalBRL: Number(vendaTotalBRL.toFixed(2)),
            vendaTotalUSD: Number(vendaTotalUSD.toFixed(2)), // Novo campo
            margemPercentual: Number(margemPercentual.toFixed(1)),
            totalVendas: vendas?.length || 0,
            totalProdutos: produtos?.length || 0
        };
        res.json(resultado);
    }
    catch (error) {
        console.error('Erro ao calcular lucro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getLucroVendas = getLucroVendas;
// Nova função para criar venda com produtos
const createVendaComProdutos = async (req, res) => {
    try {
        const { vendaData, produtos } = req.body;
        const valorEntrada = vendaData.valor_pago || 0;
        // Criar a venda SEM valor_pago inicialmente
        const vendaParaCriar = {
            ...vendaData,
            valor_pago: 0
        };
        const { data: vendaCriada, error: vendaError } = await supabaseClient_1.supabase
            .from('vendas')
            .insert([vendaParaCriar])
            .select()
            .single();
        if (vendaError) {
            res.status(400).json({ error: vendaError.message });
            return;
        }
        // Criar produtos associados à venda
        if (produtos && produtos.length > 0) {
            const produtosParaCriar = produtos.map((produto) => ({
                ...produto,
                venda_id: vendaCriada.id // Associar ao ID da venda criada
            }));
            const { data: produtosCriados, error: produtosError } = await supabaseClient_1.supabase
                .from('produtos_venda')
                .insert(produtosParaCriar)
                .select();
            if (produtosError) {
                console.error('❌ Erro ao criar produtos:', produtosError.message);
                res.status(400).json({
                    error: 'Erro ao criar produtos',
                    details: produtosError.message
                });
                return;
            }
            console.log(`✅ ${produtosCriados?.length || 0} produtos criados com sucesso`);
        }
        // Se há valor de entrada, criar o registro de pagamento
        if (valorEntrada > 0) {
            let metodoPagamento = 'dinheiro';
            if (vendaData.metodo_pagamento) {
                if (vendaData.metodo_pagamento.toLowerCase().includes('pix')) {
                    metodoPagamento = 'pix';
                }
                else if (vendaData.metodo_pagamento.toLowerCase().includes('cartao') || vendaData.metodo_pagamento.toLowerCase().includes('cartão')) {
                    metodoPagamento = 'cartao';
                }
                else if (vendaData.metodo_pagamento.toLowerCase().includes('transferencia') || vendaData.metodo_pagamento.toLowerCase().includes('transferência')) {
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
            const { error: pagamentoError } = await supabaseClient_1.supabase
                .from('pagamentos')
                .insert([pagamento]);
            if (pagamentoError) {
                console.error('Erro ao criar pagamento automático:', pagamentoError.message);
            }
            else {
                // Recalcular o valor_pago da venda
                await recalcularValorPago(vendaCriada.id);
            }
        }
        // Buscar a venda final com valor_pago atualizado
        const { data: vendaFinal } = await supabaseClient_1.supabase
            .from('vendas')
            .select('*')
            .eq('id', vendaCriada.id)
            .single();
        res.status(201).json(vendaFinal || vendaCriada);
    }
    catch (error) {
        console.error('Erro ao criar venda com produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.createVendaComProdutos = createVendaComProdutos;
// Nova função para atualizar venda com produtos
const updateVendaComProdutos = async (req, res) => {
    try {
        const { id } = req.params;
        const { vendaData, produtos } = req.body;
        const valorEntrada = vendaData.valor_pago || 0;
        // Separar dados da venda dos dados do cliente
        const { valor_pago: valorPagoInformado, metodo_entrega, ...dadosParaAtualizar } = vendaData;
        // Atualizar apenas os dados que existem na tabela vendas
        const { data: vendaAtualizada, error: updateError } = await supabaseClient_1.supabase
            .from('vendas')
            .update(dadosParaAtualizar)
            .eq('id', id)
            .select()
            .single();
        if (updateError) {
            res.status(400).json({ error: updateError.message });
            return;
        }
        // Se foi informado um metodo_entrega, atualizar a preferencia_entrega do cliente
        if (metodo_entrega && vendaData.cliente_telefone) {
            try {
                await supabaseClient_1.supabase
                    .from('clientes')
                    .update({ preferencia_entrega: metodo_entrega })
                    .eq('telefone', vendaData.cliente_telefone);
            }
            catch (error) {
                console.error('Erro ao atualizar preferência de entrega do cliente:', error);
            }
        }
        // Atualizar produtos da venda
        if (produtos && produtos.length > 0) {
            // Primeiro, deletar todos os produtos existentes desta venda
            const { error: deleteError } = await supabaseClient_1.supabase
                .from('produtos_venda')
                .delete()
                .eq('venda_id', id);
            if (deleteError) {
                console.error('❌ Erro ao deletar produtos existentes:', deleteError.message);
                res.status(400).json({
                    error: 'Erro ao atualizar produtos',
                    details: deleteError.message
                });
                return;
            }
            // Criar novos produtos associados à venda
            const produtosParaCriar = produtos.map((produto) => ({
                ...produto,
                venda_id: id // Associar ao ID da venda
            }));
            const { data: produtosCriados, error: produtosError } = await supabaseClient_1.supabase
                .from('produtos_venda')
                .insert(produtosParaCriar)
                .select();
            if (produtosError) {
                console.error('❌ Erro ao criar produtos atualizados:', produtosError.message);
                res.status(400).json({
                    error: 'Erro ao atualizar produtos',
                    details: produtosError.message
                });
                return;
            }
            console.log(`✅ ${produtosCriados?.length || 0} produtos atualizados com sucesso`);
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
                }
                else if (metodoTexto.toLowerCase().includes('cartao') || metodoTexto.toLowerCase().includes('cartão')) {
                    metodoPagamento = 'cartao';
                }
                else if (metodoTexto.toLowerCase().includes('transferencia') || metodoTexto.toLowerCase().includes('transferência')) {
                    metodoPagamento = 'transferencia';
                }
                const pagamento = {
                    venda_id: id,
                    valor: valorAdicional,
                    metodo: metodoPagamento,
                    data_pagamento: new Date().toISOString().split('T')[0],
                    observacoes: `Pagamento adicional - ${metodoTexto || 'Método não especificado'}`
                };
                const { error: pagamentoError } = await supabaseClient_1.supabase
                    .from('pagamentos')
                    .insert([pagamento]);
                if (pagamentoError) {
                    console.error('Erro ao criar pagamento adicional:', pagamentoError.message);
                }
                else {
                    // Recalcular o valor_pago após inserir o novo pagamento
                    await recalcularValorPago(id);
                }
            }
        }
        // Buscar a venda final com o valor_pago atualizado
        const { data: vendaFinal } = await supabaseClient_1.supabase
            .from('vendas')
            .select('*')
            .eq('id', id)
            .single();
        res.json(vendaFinal || vendaAtualizada);
    }
    catch (error) {
        console.error('Erro ao atualizar venda com produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.updateVendaComProdutos = updateVendaComProdutos;

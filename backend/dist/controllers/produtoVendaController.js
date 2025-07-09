"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCotacaoDolar = exports.deleteProdutoVenda = exports.updateProdutoVenda = exports.createProdutoVenda = exports.getProdutoVenda = exports.getProdutosVenda = void 0;
const supabaseClient_1 = require("../services/supabaseClient");
const cotacaoService_1 = require("../services/cotacaoService");
const getProdutosVenda = async (req, res) => {
    const { venda_id } = req.query;
    let query = supabaseClient_1.supabase.from('produtos_venda').select('*');
    // Se venda_id foi passado como query parameter, filtrar
    if (venda_id) {
        query = query.eq('venda_id', venda_id);
    }
    const { data, error } = await query;
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
};
exports.getProdutosVenda = getProdutosVenda;
const getProdutoVenda = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabaseClient_1.supabase.from('produtos_venda').select('*').eq('id', id).single();
    if (error) {
        res.status(404).json({ error: error.message });
        return;
    }
    res.json(data);
};
exports.getProdutoVenda = getProdutoVenda;
const createProdutoVenda = async (req, res) => {
    try {
        const produto = req.body;
        // Salvar produto como recebido, sem modificações
        const { data, error } = await supabaseClient_1.supabase.from('produtos_venda').insert([produto]).select().single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(201).json(data);
    }
    catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.createProdutoVenda = createProdutoVenda;
const updateProdutoVenda = async (req, res) => {
    try {
        const { id } = req.params;
        const produto = req.body;
        // Atualizar produto como recebido, sem modificações
        const { data, error } = await supabaseClient_1.supabase.from('produtos_venda').update(produto).eq('id', id).select().single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.updateProdutoVenda = updateProdutoVenda;
const deleteProdutoVenda = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseClient_1.supabase.from('produtos_venda').delete().eq('id', id);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.status(204).send();
};
exports.deleteProdutoVenda = deleteProdutoVenda;
const getCotacaoDolar = async (req, res) => {
    try {
        const cotacao = await cotacaoService_1.CotacaoService.obterCotacaoDolar();
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
    }
    catch (error) {
        console.error('Erro ao obter cotação:', error);
        res.status(500).json({ error: 'Erro ao obter cotação do dólar' });
    }
};
exports.getCotacaoDolar = getCotacaoDolar;

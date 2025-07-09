"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCliente = exports.updateCliente = exports.createCliente = exports.getCliente = exports.getClientes = void 0;
const supabaseClient_1 = require("../services/supabaseClient");
const getClientes = async (req, res) => {
    console.log('🔍 Buscando clientes...');
    const { data, error } = await supabaseClient_1.supabase.from('clientes').select('*');
    if (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        res.status(500).json({ error: error.message });
        return;
    }
    console.log('✅ Clientes encontrados:', data?.length || 0);
    res.json(data);
};
exports.getClientes = getClientes;
const getCliente = async (req, res) => {
    const { telefone } = req.params;
    console.log('🔍 Buscando cliente:', telefone);
    const { data, error } = await supabaseClient_1.supabase.from('clientes').select('*').eq('telefone', telefone).single();
    if (error) {
        console.error('❌ Erro ao buscar cliente:', error);
        res.status(404).json({ error: error.message });
        return;
    }
    console.log('✅ Cliente encontrado:', data);
    res.json(data);
};
exports.getCliente = getCliente;
const createCliente = async (req, res) => {
    console.log('🚀 === INÍCIO DA REQUISIÇÃO DE CRIAÇÃO DE CLIENTE ===');
    console.log('📝 Body recebido:', JSON.stringify(req.body, null, 2));
    const cliente = req.body;
    console.log('💾 Tentando criar cliente:', cliente);
    // Validação básica
    if (!cliente.telefone || !cliente.nome) {
        console.error('❌ Dados obrigatórios faltando:', { telefone: cliente.telefone, nome: cliente.nome });
        res.status(400).json({ error: 'Telefone e nome são obrigatórios' });
        return;
    }
    try {
        console.log('🔄 Chamando Supabase insert...');
        const { data, error } = await supabaseClient_1.supabase.from('clientes').insert([cliente]).select().single();
        if (error) {
            console.error('❌ Erro do Supabase:', JSON.stringify(error, null, 2));
            res.status(400).json({ error: error.message, details: error });
            return;
        }
        console.log('✅ Cliente criado com sucesso:', JSON.stringify(data, null, 2));
        console.log('🚀 === FIM DA REQUISIÇÃO - SUCESSO ===');
        res.status(201).json(data);
    }
    catch (err) {
        console.error('❌ Erro geral:', err);
        console.log('🚀 === FIM DA REQUISIÇÃO - ERRO ===');
        res.status(500).json({ error: 'Erro interno do servidor', details: err });
    }
};
exports.createCliente = createCliente;
const updateCliente = async (req, res) => {
    const { telefone } = req.params;
    const cliente = req.body;
    console.log('📝 Atualizando cliente:', telefone, cliente);
    const { data, error } = await supabaseClient_1.supabase.from('clientes').update(cliente).eq('telefone', telefone).select().single();
    if (error) {
        console.error('❌ Erro ao atualizar cliente:', error);
        res.status(400).json({ error: error.message });
        return;
    }
    console.log('✅ Cliente atualizado:', data);
    res.json(data);
};
exports.updateCliente = updateCliente;
const deleteCliente = async (req, res) => {
    const { telefone } = req.params;
    console.log('🗑️ Deletando cliente:', telefone);
    const { error } = await supabaseClient_1.supabase.from('clientes').delete().eq('telefone', telefone);
    if (error) {
        console.error('❌ Erro ao deletar cliente:', error);
        res.status(400).json({ error: error.message });
        return;
    }
    console.log('✅ Cliente deletado');
    res.status(204).send();
};
exports.deleteCliente = deleteCliente;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
  try {
    // Verificar token de autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de acesso requerido. Faça login para continuar.' });
      return;
    }

    const token = authHeader.substring(7);
    
    // Validar token com Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    if (req.method === 'GET') {
      // Buscar pagamentos
      const { data: pagamentos, error: pagamentosError } = await supabase
        .from('pagamentos')
        .select('*')
        .order('data_pagamento', { ascending: false });
      
      if (pagamentosError) {
        res.status(500).json({ error: pagamentosError.message });
        return;
      }

      // Buscar vendas para obter informações dos clientes
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('id, cliente_telefone, valor_total');

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

      // Combinar dados
      const pagamentosComInfo = pagamentos?.map(pagamento => {
        const venda = vendas?.find(v => v.id === pagamento.venda_id);
        const cliente = clientes?.find(c => c.telefone === venda?.cliente_telefone);
        
        return {
          ...pagamento,
          cliente_nome: cliente?.nome || 'Cliente não encontrado',
          valor_total_venda: venda?.valor_total || 0
        };
      });

      res.json(pagamentosComInfo || []);
      return;
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from('pagamentos')
        .insert([req.body])
        .select()
        .single();
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(201).json(data);
      return;
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { data, error } = await supabase
        .from('pagamentos')
        .update(req.body)
        .eq('id', id as string)
        .select()
        .single();
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json(data);
      return;
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase
        .from('pagamentos')
        .delete()
        .eq('id', id as string);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro ao processar pagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 
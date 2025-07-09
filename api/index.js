const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wdzqpvyjqbcgbhajmeek.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkenFwdnlqcWJjZ2JoYWptZWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDgwNjYsImV4cCI6MjA1MDQ4NDA2Nn0.u8tn2VB26Y1UlYD32jcCn6jvjfWdZe5kCnEhzYb42SY';

// Função para verificar autenticação
async function verificarAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de acesso requerido. Faça login para continuar.');
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Token inválido');
  }

  return { supabase, user };
}

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const path = req.url;

    // Rota de teste
    if (path === '/test' || path === '/api/test') {
      return res.json({ 
        message: 'API funcionando!', 
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }

    // Rota hello
    if (path === '/hello' || path === '/api/hello') {
      return res.json({ message: 'Hello World from unified API!' });
    }

    // Rotas que precisam de autenticação
    let supabase, user;
    try {
      ({ supabase, user } = await verificarAuth(req));
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }

    // Rota de clientes
    if (path.startsWith('/clientes') || path.startsWith('/api/clientes')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('clientes').select('*');
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }
      
      if (req.method === 'POST') {
        const { data, error } = await supabase
          .from('clientes')
          .insert([req.body])
          .select()
          .single();
        
        if (error) return res.status(400).json({ error: error.message });
        return res.status(201).json(data);
      }
    }

    // Rota de vendas
    if (path.startsWith('/vendas') || path.startsWith('/api/vendas')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('vendas')
          .select(`
            *,
            produtos_venda (
              *,
              produto:produtos (*)
            ),
            cliente:clientes (*)
          `)
          .order('data_venda', { ascending: false });
        
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }
    }

    // Rota de produtos-venda
    if (path.startsWith('/produtos-venda') || path.startsWith('/api/produtos-venda')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('produtos_venda').select('*');
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }
    }

    // Rota de pagamentos
    if (path.startsWith('/pagamentos') || path.startsWith('/api/pagamentos')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('pagamentos').select('*');
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }
    }

    return res.status(404).json({ error: 'Endpoint não encontrado' });

  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}; 
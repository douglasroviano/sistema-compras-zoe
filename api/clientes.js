const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wdzqpvyjqbcgbhajmeek.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkenFwdnlqcWJjZ2JoYWptZWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDgwNjYsImV4cCI6MjA1MDQ4NDA2Nn0.u8tn2VB26Y1UlYD32jcCn6jvjfWdZe5kCnEhzYb42SY';

module.exports = async (req, res) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verificar token de autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acesso requerido. Faça login para continuar.' });
    }

    const token = authHeader.substring(7);
    
    // Validar token com Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (req.method === 'GET') {
      // Se tem telefone na URL, buscar cliente específico
      if (req.query.telefone) {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('telefone', req.query.telefone)
          .single();
        
        if (error) {
          return res.status(404).json({ error: error.message });
        }
        return res.json(data);
      }

      // Buscar todos os clientes
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.json(data);
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from('clientes')
        .insert([req.body])
        .select()
        .single();
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { telefone } = req.query;
      const { data, error } = await supabase
        .from('clientes')
        .update(req.body)
        .eq('telefone', telefone)
        .select()
        .single();
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json(data);
    }

    if (req.method === 'DELETE') {
      const { telefone } = req.query;
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('telefone', telefone);
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}; 
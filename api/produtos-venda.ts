const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wdzqpvyjqbcgbhajmeek.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkenFwdnlqcWJjZ2JoYWptZWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDgwNjYsImV4cCI6MjA1MDQ4NDA2Nn0.u8tn2VB26Y1UlYD32jcCn6jvjfWdZe5kCnEhzYb42SY';

module.exports = async (req: any, res: any) => {
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
      const { data, error } = await supabase.from('produtos_venda').select('*');
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.json(data);
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from('produtos_venda')
        .insert([req.body])
        .select()
        .single();
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { data, error } = await supabase
        .from('produtos_venda')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase
        .from('produtos_venda')
        .delete()
        .eq('id', id);
      
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
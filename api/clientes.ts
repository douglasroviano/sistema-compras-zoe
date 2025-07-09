import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wdzqpvyjqbcgbhajmeek.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkenFwdnlqcWJjZ2JoYWptZWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDgwNjYsImV4cCI6MjA1MDQ4NDA2Nn0.u8tn2VB26Y1UlYD32jcCn6jvjfWdZe5kCnEhzYb42SY';

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
      // Se tem telefone na URL, buscar cliente específico
      if (req.query.telefone) {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('telefone', req.query.telefone as string)
          .single();
        
        if (error) {
          res.status(404).json({ error: error.message });
          return;
        }
        res.json(data);
        return;
      }

      // Buscar todos os clientes
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json(data);
      return;
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from('clientes')
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
      const { telefone } = req.query;
      const { data, error } = await supabase
        .from('clientes')
        .update(req.body)
        .eq('telefone', telefone as string)
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
      const { telefone } = req.query;
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('telefone', telefone as string);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 
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
      const { venda_id } = req.query;
      
      let query = supabase.from('produtos_venda').select('*');
      
      // Se venda_id foi passado como query parameter, filtrar
      if (venda_id) {
        query = query.eq('venda_id', venda_id as string);
      }
      
      const { data, error } = await query;
      
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json(data);
      return;
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from('produtos_venda')
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
        .from('produtos_venda')
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
        .from('produtos_venda')
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
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 
import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.status(200).json({ 
      message: 'API funcionando!', 
      method: req.method,
      timestamp: new Date().toISOString(),
      env: {
        hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno', details: error });
  }
} 
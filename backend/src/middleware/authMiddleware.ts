import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseClient';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    aud: string;
    role?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Token de acesso requerido. Faça login para continuar.' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Erro na verificação do token:', error);
      res.status(401).json({ 
        error: 'Token inválido ou expirado. Faça login novamente.' 
      });
      return;
    }

    // Adicionar dados do usuário à requisição
    req.user = {
      id: user.id,
      email: user.email,
      aud: user.aud,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor na autenticação.' 
    });
  }
};

// Middleware opcional que permite acesso sem autenticação mas adiciona user se presente
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          aud: user.aud,
          role: user.role
        };
      }
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação opcional:', error);
    next(); // Continua mesmo com erro pois é opcional
  }
};

export type { AuthenticatedRequest }; 
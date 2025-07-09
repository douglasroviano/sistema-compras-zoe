"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const supabaseClient_1 = require("../services/supabaseClient");
const authMiddleware = async (req, res, next) => {
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
        const { data: { user }, error } = await supabaseClient_1.supabase.auth.getUser(token);
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
    }
    catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor na autenticação.'
        });
    }
};
exports.authMiddleware = authMiddleware;
// Middleware opcional que permite acesso sem autenticação mas adiciona user se presente
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user }, error } = await supabaseClient_1.supabase.auth.getUser(token);
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
    }
    catch (error) {
        console.error('Erro no middleware de autenticação opcional:', error);
        next(); // Continua mesmo com erro pois é opcional
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;

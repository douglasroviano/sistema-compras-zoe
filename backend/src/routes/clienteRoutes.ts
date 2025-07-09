import { Router } from 'express';
import { getClientes, getCliente, createCliente, updateCliente, deleteCliente } from '../controllers/clienteController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

router.get('/', getClientes);
router.get('/:telefone', getCliente);
router.post('/', createCliente);
router.put('/:telefone', updateCliente);
router.delete('/:telefone', deleteCliente);

export default router; 
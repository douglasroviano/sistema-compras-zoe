import { Router } from 'express';
import { getPagamentos, getPagamento, createPagamento, updatePagamento, deletePagamento, createPagamentoPorCliente } from '../controllers/pagamentoController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

router.get('/', getPagamentos);
router.get('/:id', getPagamento);
router.post('/', createPagamento);
router.put('/:id', updatePagamento);
router.delete('/:id', deletePagamento);

// Nova rota: Pagamento por Cliente com distribuição automática
router.post('/por-cliente', createPagamentoPorCliente);

export default router; 
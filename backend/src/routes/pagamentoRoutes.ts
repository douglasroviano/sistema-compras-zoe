import { Router } from 'express';
import { getPagamentos, getPagamento, createPagamento, updatePagamento, deletePagamento } from '../controllers/pagamentoController';

const router = Router();

router.get('/', getPagamentos);
router.get('/:id', getPagamento);
router.post('/', createPagamento);
router.put('/:id', updatePagamento);
router.delete('/:id', deletePagamento);

export default router; 
import { Router } from 'express';
import { getVendas, getVenda, createVenda, updateVenda, deleteVenda } from '../controllers/vendaController';

const router = Router();

router.get('/', getVendas);
router.get('/:id', getVenda);
router.post('/', createVenda);
router.put('/:id', updateVenda);
router.delete('/:id', deleteVenda);

export default router; 
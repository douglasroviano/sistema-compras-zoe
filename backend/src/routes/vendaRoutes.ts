import { Router } from 'express';
import { getVendas, getVenda, createVenda, updateVenda, deleteVenda, getLucroVendas, createVendaComProdutos, updateVendaComProdutos } from '../controllers/vendaController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

router.get('/lucro', getLucroVendas);
router.get('/', getVendas);
router.get('/:id', getVenda);
router.post('/', createVenda);
router.post('/com-produtos', createVendaComProdutos);
router.put('/:id', updateVenda);
router.put('/:id/com-produtos', updateVendaComProdutos);
router.delete('/:id', deleteVenda);

export default router; 
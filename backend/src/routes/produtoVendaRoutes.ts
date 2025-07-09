import { Router } from 'express';
import { getProdutosVenda, getProdutoVenda, createProdutoVenda, updateProdutoVenda, deleteProdutoVenda, getCotacaoDolar } from '../controllers/produtoVendaController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Rota pública para cotação do dólar (sem autenticação)
router.get('/cotacao-dolar', getCotacaoDolar);

// Aplicar middleware de autenticação às demais rotas
router.use(authMiddleware);

router.get('/', getProdutosVenda);
router.get('/:id', getProdutoVenda);
router.post('/', createProdutoVenda);
router.put('/:id', updateProdutoVenda);
router.delete('/:id', deleteProdutoVenda);

export default router; 
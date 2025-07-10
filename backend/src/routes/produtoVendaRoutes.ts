import { Router } from 'express';
import { getProdutosVenda, getProdutoVenda, createProdutoVenda, updateProdutoVenda, deleteProdutoVenda, getCotacaoDolar } from '../controllers/produtoVendaController';

const router = Router();

router.get('/', getProdutosVenda);
router.get('/:id', getProdutoVenda);
router.post('/', createProdutoVenda);
router.put('/:id', updateProdutoVenda);
router.delete('/:id', deleteProdutoVenda);
router.get('/cotacao-dolar', getCotacaoDolar);

export default router; 
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const produtoVendaController_1 = require("../controllers/produtoVendaController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Rota pública para cotação do dólar (sem autenticação)
router.get('/cotacao-dolar', produtoVendaController_1.getCotacaoDolar);
// Aplicar middleware de autenticação às demais rotas
router.use(authMiddleware_1.authMiddleware);
router.get('/', produtoVendaController_1.getProdutosVenda);
router.get('/:id', produtoVendaController_1.getProdutoVenda);
router.post('/', produtoVendaController_1.createProdutoVenda);
router.put('/:id', produtoVendaController_1.updateProdutoVenda);
router.delete('/:id', produtoVendaController_1.deleteProdutoVenda);
exports.default = router;

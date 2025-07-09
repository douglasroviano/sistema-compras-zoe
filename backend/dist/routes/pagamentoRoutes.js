"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pagamentoController_1 = require("../controllers/pagamentoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware_1.authMiddleware);
router.get('/', pagamentoController_1.getPagamentos);
router.get('/:id', pagamentoController_1.getPagamento);
router.post('/', pagamentoController_1.createPagamento);
router.put('/:id', pagamentoController_1.updatePagamento);
router.delete('/:id', pagamentoController_1.deletePagamento);
// Nova rota: Pagamento por Cliente com distribuição automática
router.post('/por-cliente', pagamentoController_1.createPagamentoPorCliente);
exports.default = router;

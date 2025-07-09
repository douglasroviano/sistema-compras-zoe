"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendaController_1 = require("../controllers/vendaController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware_1.authMiddleware);
router.get('/lucro', vendaController_1.getLucroVendas);
router.get('/', vendaController_1.getVendas);
router.get('/:id', vendaController_1.getVenda);
router.post('/', vendaController_1.createVenda);
router.post('/com-produtos', vendaController_1.createVendaComProdutos);
router.put('/:id', vendaController_1.updateVenda);
router.put('/:id/com-produtos', vendaController_1.updateVendaComProdutos);
router.delete('/:id', vendaController_1.deleteVenda);
exports.default = router;

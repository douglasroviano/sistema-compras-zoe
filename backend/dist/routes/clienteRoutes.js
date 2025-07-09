"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clienteController_1 = require("../controllers/clienteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware_1.authMiddleware);
router.get('/', clienteController_1.getClientes);
router.get('/:telefone', clienteController_1.getCliente);
router.post('/', clienteController_1.createCliente);
router.put('/:telefone', clienteController_1.updateCliente);
router.delete('/:telefone', clienteController_1.deleteCliente);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const clienteRoutes_1 = __importDefault(require("./routes/clienteRoutes"));
const vendaRoutes_1 = __importDefault(require("./routes/vendaRoutes"));
const produtoVendaRoutes_1 = __importDefault(require("./routes/produtoVendaRoutes"));
const pagamentoRoutes_1 = __importDefault(require("./routes/pagamentoRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Importar rotas (a serem criadas)
// import pagamentoRoutes from './routes/pagamentoRoutes';
app.use('/api/clientes', clienteRoutes_1.default);
app.use('/api/vendas', vendaRoutes_1.default);
app.use('/api/produtos-venda', produtoVendaRoutes_1.default);
app.use('/api/pagamentos', pagamentoRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
// app.use('/api/pagamentos', pagamentoRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

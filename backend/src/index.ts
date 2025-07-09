import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import clienteRoutes from './routes/clienteRoutes';
import vendaRoutes from './routes/vendaRoutes';
import produtoVendaRoutes from './routes/produtoVendaRoutes';
import pagamentoRoutes from './routes/pagamentoRoutes';
import uploadRoutes from './routes/uploadRoutes';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Importar rotas (a serem criadas)
// import pagamentoRoutes from './routes/pagamentoRoutes';

app.use('/api/clientes', clienteRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/produtos-venda', produtoVendaRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/upload', uploadRoutes);
// app.use('/api/pagamentos', pagamentoRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 
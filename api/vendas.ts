import { supabase } from './services/supabaseClient';

export default async function handler(req: any, res: any) {
  try {
    // Verificar método HTTP
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    // Verificar token de autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de acesso requerido. Faça login para continuar.' });
      return;
    }

    const token = authHeader.substring(7);
    
    // Validar token com Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    // Buscar vendas
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('*');
    
    if (vendasError) {
      res.status(500).json({ error: vendasError.message });
      return;
    }

    // Buscar clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('telefone, nome');

    if (clientesError) {
      res.status(500).json({ error: clientesError.message });
      return;
    }

    // Buscar produtos de todas as vendas
    const { data: todosProdutos, error: produtosError } = await supabase
      .from('produtos_venda')
      .select('*');

    if (produtosError) {
      res.status(500).json({ error: produtosError.message });
      return;
    }

    // Buscar todos os pagamentos para recalcular valores pagos corretamente
    const { data: todosPagamentos, error: pagamentosError } = await supabase
      .from('pagamentos')
      .select('*');

    if (pagamentosError) {
      res.status(500).json({ error: pagamentosError.message });
      return;
    }

    // Combinar os dados
    const vendasComClientes = vendas?.map(venda => {
      const cliente = clientes?.find(c => c.telefone === venda.cliente_telefone);
      
      // Calcular valor pago real da tabela pagamentos
      const pagamentosVenda = todosPagamentos?.filter(p => p.venda_id === venda.id) || [];
      const valorPagoReal = pagamentosVenda.reduce((sum, p) => sum + p.valor, 0);
      
      // Buscar produtos desta venda e mapear para o formato esperado pelo frontend
      const produtosVenda = todosProdutos?.filter(p => p.venda_id === venda.id) || [];
      const totalProdutos = produtosVenda.length;
      
      // Mapear produtos para o formato que o frontend espera
      const produtosFormatados = produtosVenda.map(produto => ({
        nome_produto: produto.nome_produto,
        marca: produto.marca,
        quantidade: produto.quantidade || 1
      }));
      
      return {
        ...venda,
        cliente_nome: cliente?.nome || 'Cliente não encontrado',
        valor_pago: valorPagoReal, // Sobrescrever com valor real da tabela pagamentos
        total_produtos: totalProdutos,
        produtos: produtosFormatados // Produtos formatados para o frontend
      };
    });

    res.json(vendasComClientes || []);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 
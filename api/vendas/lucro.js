import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ayhwvuvvgdvvqmsphduz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aHd2dXZ2Z2R2dnFtc3BoZHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNDI0MTUsImV4cCI6MjA0OTcxODQxNX0.v3m0L76qKmGKHZJMGWTqYvG86xJB8Tj4z-jmKMOAuVY';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Adicionar headers CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      console.log('🔥 API /vendas/lucro - Calculando dados DINÂMICOS do banco...');
      
      // Buscar todas as vendas
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('id, valor_total, status_venda, data_venda');
      
      if (vendasError) {
        console.error('❌ Erro ao buscar vendas:', vendasError);
        return res.status(500).json({ error: vendasError.message });
      }

      // Buscar todos os produtos vendidos COM TODAS as informações necessárias
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos_venda')
        .select('venda_id, preco_compra, preco_venda, imposto_percentual, dolar_agora, quantidade');
      
      if (produtosError) {
        console.error('❌ Erro ao buscar produtos:', produtosError);
        return res.status(500).json({ error: produtosError.message });
      }

      console.log(`📊 Processando ${produtos?.length || 0} produtos de ${vendas?.length || 0} vendas`);

      // ELIMINAR valores hardcoded - calcular tudo dinamicamente
      let custoTotalUSD = 0;
      let custoTotalBRL = 0;
      let vendaTotalBRL = 0;
      let vendaTotalUSD = 0;
      let totalProdutos = 0;
      let somaCotacoesPonderadas = 0;
      let somaQuantidades = 0;

      // Calcular TUDO baseado nos dados reais do banco
      produtos?.forEach(produto => {
        const quantidade = produto.quantidade || 1;
        const precoCompraUSD = produto.preco_compra || 0;
        const precoVendaBRL = produto.preco_venda || 0;
        
        // Usar imposto REAL do banco ou padrão definido no banco
        const impostoPercentual = produto.imposto_percentual || 0; // Se não tem no banco, é 0
        
        // Usar cotação REAL do banco (histórica da venda)
        const cotacaoProduto = produto.dolar_agora;
        
        // SÓ processar produtos que têm cotação histórica
        if (cotacaoProduto && cotacaoProduto > 0) {
          // Calcular custo real (gôndola + imposto) - DINÂMICO
          const custoRealUSD = precoCompraUSD * (1 + impostoPercentual / 100);
          const custoRealBRL = custoRealUSD * cotacaoProduto;
          
          // Calcular venda em USD usando cotação histórica do produto
          const vendaProdutoUSD = precoVendaBRL / cotacaoProduto;
          
          // Acumular totais
          custoTotalUSD += custoRealUSD * quantidade;
          custoTotalBRL += custoRealBRL * quantidade;
          vendaTotalBRL += precoVendaBRL * quantidade;
          vendaTotalUSD += vendaProdutoUSD * quantidade;
          totalProdutos += quantidade;
          
          // Para cálculo de cotação média ponderada
          somaCotacoesPonderadas += cotacaoProduto * quantidade;
          somaQuantidades += quantidade;
        }
      });

      // Calcular cotação média ponderada dos produtos vendidos
      const cotacaoMediaPonderada = somaQuantidades > 0 ? somaCotacoesPonderadas / somaQuantidades : 0;
      
      // Calcular lucros dinâmicos
      const lucroTotalUSD = vendaTotalUSD - custoTotalUSD;
      const lucroTotalBRL = vendaTotalBRL - custoTotalBRL;
      
      // Calcular margem dinâmica
      const margemPercentual = vendaTotalBRL > 0 ? (lucroTotalBRL / vendaTotalBRL) * 100 : 0;

      const resultado = {
        lucroTotalUSD: Number(lucroTotalUSD.toFixed(2)),
        lucroTotalBRL: Number(lucroTotalBRL.toFixed(2)),
        custoTotalUSD: Number(custoTotalUSD.toFixed(2)),
        custoTotalBRL: Number(custoTotalBRL.toFixed(2)),
        vendaTotalBRL: Number(vendaTotalBRL.toFixed(2)),
        vendaTotalUSD: Number(vendaTotalUSD.toFixed(2)),
        margemPercentual: Number(margemPercentual.toFixed(1)),
        totalVendas: vendas?.length || 0,
        totalProdutos: totalProdutos,
        cotacaoMediaPonderada: Number(cotacaoMediaPonderada.toFixed(4)) // Para debug
      };

      console.log('✅ Dados DINÂMICOS calculados do banco:', resultado);
      return res.status(200).json(resultado);

    } catch (error) {
      console.error('💥 ERRO CRÍTICO em /vendas/lucro:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
} 
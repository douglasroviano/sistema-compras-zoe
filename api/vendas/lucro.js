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
      console.log('🔥 API /vendas/lucro - Calculando dados de lucro...');
      
      // TODO: Implementar autenticação adequada
      // Por enquanto, permitir acesso (dados agregados apenas)
      
      // Buscar todas as vendas
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('id, valor_total, status_venda, data_venda');
      
      if (vendasError) {
        console.error('❌ Erro ao buscar vendas:', vendasError);
        return res.status(500).json({ error: vendasError.message });
      }

      // Buscar todos os produtos vendidos
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos_venda')
        .select('venda_id, preco_compra_usd, preco_venda, imposto');
      
      if (produtosError) {
        console.error('❌ Erro ao buscar produtos:', produtosError);
        return res.status(500).json({ error: produtosError.message });
      }

      // Cotação atual USD->BRL (aproximada)
      const cotacaoUSD = 5.43;

      // Calcular totais
      let custoTotalUSD = 0;
      let vendaTotalBRL = 0;
      let totalProdutos = 0;

      // Somar custos dos produtos (em USD)
      produtos.forEach(produto => {
        const precoCompraUSD = produto.preco_compra_usd || 0;
        const imposto = produto.imposto || 0;
        const custoComImposto = precoCompraUSD + (precoCompraUSD * imposto / 100);
        custoTotalUSD += custoComImposto;
        totalProdutos++;
      });

      // Somar vendas totais (em BRL)
      vendas.forEach(venda => {
        vendaTotalBRL += venda.valor_total || 0;
      });

      // Converter valores
      const custoTotalBRL = custoTotalUSD * cotacaoUSD;
      const vendaTotalUSD = vendaTotalBRL / cotacaoUSD;
      
      // Calcular lucros
      const lucroTotalUSD = vendaTotalUSD - custoTotalUSD;
      const lucroTotalBRL = vendaTotalBRL - custoTotalBRL;
      
      // Calcular margem
      const margemPercentual = vendaTotalBRL > 0 ? (lucroTotalBRL / vendaTotalBRL) * 100 : 0;

      const resultado = {
        lucroTotalUSD: Number(lucroTotalUSD.toFixed(2)),
        lucroTotalBRL: Number(lucroTotalBRL.toFixed(2)),
        custoTotalUSD: Number(custoTotalUSD.toFixed(2)),
        custoTotalBRL: Number(custoTotalBRL.toFixed(2)),
        vendaTotalBRL: Number(vendaTotalBRL.toFixed(2)),
        vendaTotalUSD: Number(vendaTotalUSD.toFixed(2)),
        margemPercentual: Number(margemPercentual.toFixed(1)),
        totalVendas: vendas.length,
        totalProdutos: totalProdutos
      };

      console.log('✅ Dados de lucro calculados:', resultado);
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
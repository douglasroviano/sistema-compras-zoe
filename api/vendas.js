module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== INÍCIO DA FUNÇÃO VENDAS ===');
    console.log('Method:', req.method);
    
    // Check environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log('Environment check:');
    console.log('- Final supabaseUrl:', !!supabaseUrl);
    console.log('- Final supabaseKey:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({ 
        error: 'Configuração do servidor incompleta',
        details: { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey }
      });
    }

    // Dynamic import of Supabase
    let createClient;
    try {
      console.log('Importing @supabase/supabase-js...');
      const supabaseModule = require('@supabase/supabase-js');
      createClient = supabaseModule.createClient;
      console.log('Supabase module imported successfully');
    } catch (importError) {
      console.error('Failed to import Supabase:', importError);
      return res.status(500).json({ 
        error: 'Erro ao carregar dependências do servidor',
        details: importError.message 
      });
    }

    // Create Supabase client
    let supabase;
    try {
      console.log('Creating Supabase client...');
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError);
      return res.status(500).json({ 
        error: 'Erro ao conectar com o banco de dados',
        details: clientError.message 
      });
    }

    // Check authentication
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'Token de acesso requerido. Faça login para continuar.' });
    }

    const token = authHeader.substring(7);
    console.log('Token length:', token.length);

    // Validate token with Supabase
    let user;
    try {
      console.log('Validating token with Supabase...');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error('Auth error:', authError);
        return res.status(401).json({ error: 'Token inválido', details: authError.message });
      }
      
      if (!authUser) {
        console.error('No user returned from auth');
        return res.status(401).json({ error: 'Token inválido - usuário não encontrado' });
      }
      
      user = authUser;
      console.log('User authenticated successfully:', user.id);
    } catch (authError) {
      console.error('Exception during auth:', authError);
      return res.status(401).json({ error: 'Erro na autenticação', details: authError.message });
    }

    // Handle different HTTP methods
    console.log('Processing method:', req.method);

    if (req.method === 'GET') {
      try {
        console.log('Executing GET request...');
        
        // Rota para lucro de vendas
        if (req.url && req.url.includes('/lucro')) {
          console.log('Getting lucro data...');
          
          try {
            // Buscar todas as vendas com produtos
            const { data: vendas, error: vendasError } = await supabase
              .from('vendas')
              .select(`
                id,
                valor_total,
                status_venda,
                data_venda
              `);
            
            if (vendasError) {
              console.error('Error fetching vendas for lucro:', vendasError);
              return res.status(500).json({ error: vendasError.message });
            }

            // Buscar produtos de venda
            const { data: produtos, error: produtosError } = await supabase
              .from('produtos_venda')
              .select(`
                venda_id,
                preco_compra,
                preco_venda,
                quantidade,
                dolar_agora,
                imposto_percentual
              `);
            
            if (produtosError) {
              console.error('Error fetching produtos for lucro:', produtosError);
              return res.status(500).json({ error: produtosError.message });
            }

            // Calcular métricas
            let custoTotalUSD = 0;
            let custoTotalBRL = 0;
            let vendaTotalBRL = 0;
            let vendaTotalUSD = 0;
            let totalProdutos = 0;
            
            produtos.forEach(produto => {
              const quantidade = produto.quantidade || 1;
              const precoCompra = produto.preco_compra || 0;
              const precoVenda = produto.preco_venda || 0;
              const cotacao = produto.dolar_agora || 5.20;
              const imposto = produto.imposto_percentual || 7;
              
              // Custo real USD (com imposto)
              const custoRealUSD = precoCompra * (1 + imposto / 100);
              const custoRealBRL = custoRealUSD * cotacao;
              
              custoTotalUSD += custoRealUSD * quantidade;
              custoTotalBRL += custoRealBRL * quantidade;
              vendaTotalBRL += precoVenda * quantidade;
              totalProdutos += quantidade;
            });
            
            // Converter venda total para USD
            vendaTotalUSD = vendaTotalBRL / 5.20; // Cotação média
            
            // Calcular lucro
            const lucroTotalUSD = vendaTotalUSD - custoTotalUSD;
            const lucroTotalBRL = vendaTotalBRL - custoTotalBRL;
            const margemPercentual = custoTotalBRL > 0 ? ((lucroTotalBRL / custoTotalBRL) * 100) : 0;
            
            const lucroData = {
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
            
            console.log('Lucro data calculated successfully:', lucroData);
            return res.json(lucroData);
            
          } catch (lucroError) {
            console.error('Error calculating lucro:', lucroError);
            return res.status(500).json({ error: 'Erro ao calcular lucro', details: lucroError.message });
          }
        }
        
        if (req.query.id) {
          console.log('Getting specific sale by ID:', req.query.id);
          const { data, error } = await supabase
            .from('vendas')
            .select(`
              *,
              clientes!inner(nome, telefone),
              produtos_venda!inner(
                id,
                produto_id,
                quantidade,
                preco_venda_brl,
                preco_compra_usd,
                lucro_usd,
                lucro_brl
              )
            `)
            .eq('id', req.query.id)
            .single();
          
          if (error) {
            console.error('Error fetching specific sale:', error);
            return res.status(404).json({ error: error.message });
          }
          
          console.log('Sale found successfully');
          return res.json(data);
        }

        console.log('Getting all sales...');
        const { data, error } = await supabase
          .from('vendas')
          .select('*')
          .order('data_venda', { ascending: false });
        
        if (error) {
          console.error('Error fetching sales:', error);
          return res.status(500).json({ error: error.message });
        }
        
        console.log('Sales fetched successfully, count:', data?.length || 0);
        return res.json(data || []);

      } catch (getError) {
        console.error('Exception during GET:', getError);
        return res.status(500).json({ error: 'Erro ao buscar vendas', details: getError.message });
      }
    }

    if (req.method === 'POST') {
      try {
        console.log('Executing POST request...');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { data, error } = await supabase
          .from('vendas')
          .insert([req.body])
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting sale:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Sale created successfully');
        return res.status(201).json(data);

      } catch (postError) {
        console.error('Exception during POST:', postError);
        return res.status(500).json({ error: 'Erro ao criar venda', details: postError.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        console.log('Executing PUT request...');
        const { id } = req.query;
        console.log('Updating sale with ID:', id);
        console.log('Update data:', JSON.stringify(req.body, null, 2));
        
        const { data, error } = await supabase
          .from('vendas')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating sale:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Sale updated successfully');
        return res.json(data);

      } catch (putError) {
        console.error('Exception during PUT:', putError);
        return res.status(500).json({ error: 'Erro ao atualizar venda', details: putError.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        console.log('Executing DELETE request...');
        const { id } = req.query;
        console.log('Deleting sale with ID:', id);
        
        const { error } = await supabase
          .from('vendas')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting sale:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Sale deleted successfully');
        return res.status(204).end();

      } catch (deleteError) {
        console.error('Exception during DELETE:', deleteError);
        return res.status(500).json({ error: 'Erro ao deletar venda', details: deleteError.message });
      }
    }

    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('=== ERRO GERAL NA FUNÇÃO VENDAS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== FIM DO ERRO ===');
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message,
      name: error.name
    });
  }
}; 
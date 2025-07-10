module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== INÍCIO DA FUNÇÃO PRODUTOS VENDA ===');
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
    console.log('Request URL:', req.url);

    if (req.method === 'GET') {
      try {
        console.log('Executing GET request...');
        
        // Endpoint específico para cotação do dólar (FALTAVA ESTE!)
        if (req.url?.includes('/cotacao-dolar') || req.query.cotacao === 'true') {
          console.log('📈 Endpoint de cotação do dólar acessado!');
          
          try {
            // Usar fetch nativo para obter cotação atual
            const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
            
            if (!response.ok) {
              throw new Error(`Erro na API de cotação: ${response.status}`);
            }
            
            const data = await response.json();
            const cotacao = parseFloat(data.USDBRL.bid);
            
            if (isNaN(cotacao) || cotacao <= 0) {
              throw new Error('Cotação inválida recebida da API');
            }
            
            console.log(`✅ Cotação USD/BRL obtida: R$ ${cotacao.toFixed(4)}`);
            
            return res.json({
              cotacao: cotacao,
              timestamp: new Date().toISOString(),
              fonte: 'AwesomeAPI'
            });
            
          } catch (cotacaoError) {
            console.error('❌ Erro ao obter cotação do dólar:', cotacaoError);
            
            // Fallback: buscar cotação mais recente do banco de dados
            try {
              const { data: produtoRecente, error: dbError } = await supabase
                .from('produtos_venda')
                .select('dolar_agora')
                .not('dolar_agora', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              if (!dbError && produtoRecente?.dolar_agora) {
                console.log(`⚡ Usando cotação do banco como fallback: R$ ${produtoRecente.dolar_agora}`);
                return res.json({
                  cotacao: produtoRecente.dolar_agora,
                  timestamp: new Date().toISOString(),
                  fonte: 'Database Fallback'
                });
              }
            } catch (dbFallbackError) {
              console.error('❌ Fallback do banco também falhou:', dbFallbackError);
            }
            
            // Último fallback: cotação padrão
            const cotacaoFallback = 5.40;
            console.log(`🔄 Usando cotação padrão como último fallback: R$ ${cotacaoFallback}`);
            return res.json({
              cotacao: cotacaoFallback,
              timestamp: new Date().toISOString(),
              fonte: 'Fallback Padrão'
            });
          }
        }
        
        if (req.query.venda_id) {
          console.log('Getting products by sale ID:', req.query.venda_id);
          const { data, error } = await supabase
            .from('produtos_venda')
            .select('*')
            .eq('venda_id', req.query.venda_id);
          
          if (error) {
            console.error('Error fetching products by sale ID:', error);
            return res.status(500).json({ error: error.message });
          }
          
          console.log('Products found successfully, count:', data?.length || 0);
          return res.json(data || []);
        }

        if (req.query.id) {
          console.log('Getting specific product by ID:', req.query.id);
          const { data, error } = await supabase
            .from('produtos_venda')
            .select('*')
            .eq('id', req.query.id)
            .single();
          
          if (error) {
            console.error('Error fetching specific product:', error);
            return res.status(404).json({ error: error.message });
          }
          
          console.log('Product found successfully');
          return res.json(data);
        }

        console.log('Getting all products...');
        const { data, error } = await supabase
          .from('produtos_venda')
          .select('*');
        
        if (error) {
          console.error('Error fetching products:', error);
          return res.status(500).json({ error: error.message });
        }
        
        console.log('Products fetched successfully, count:', data?.length || 0);
        return res.json(data || []);

      } catch (getError) {
        console.error('Exception during GET:', getError);
        return res.status(500).json({ error: 'Erro ao buscar produtos de venda', details: getError.message });
      }
    }

    if (req.method === 'POST') {
      try {
        console.log('Executing POST request...');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { data, error } = await supabase
          .from('produtos_venda')
          .insert([req.body])
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting product:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Product created successfully');
        return res.status(201).json(data);

      } catch (postError) {
        console.error('Exception during POST:', postError);
        return res.status(500).json({ error: 'Erro ao criar produto de venda', details: postError.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        console.log('Executing PUT request...');
        const { id } = req.query;
        console.log('Updating product with ID:', id);
        console.log('Update data:', JSON.stringify(req.body, null, 2));
        
        const { data, error } = await supabase
          .from('produtos_venda')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating product:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Product updated successfully');
        return res.json(data);

      } catch (putError) {
        console.error('Exception during PUT:', putError);
        return res.status(500).json({ error: 'Erro ao atualizar produto de venda', details: putError.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        console.log('Executing DELETE request...');
        const { id } = req.query;
        console.log('Deleting product with ID:', id);
        
        const { error } = await supabase
          .from('produtos_venda')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting product:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Product deleted successfully');
        return res.status(204).end();

      } catch (deleteError) {
        console.error('Exception during DELETE:', deleteError);
        return res.status(500).json({ error: 'Erro ao deletar produto de venda', details: deleteError.message });
      }
    }

    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('=== ERRO GERAL NA FUNÇÃO PRODUTOS VENDA ===');
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
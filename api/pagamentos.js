module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== INÍCIO DA FUNÇÃO PAGAMENTOS ===');
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
        
        if (req.query.cliente_telefone) {
          console.log('Getting payments by client phone:', req.query.cliente_telefone);
          const { data, error } = await supabase
            .from('pagamentos')
            .select('*')
            .eq('cliente_telefone', req.query.cliente_telefone)
            .order('data_pagamento', { ascending: false });
          
          if (error) {
            console.error('Error fetching payments by client:', error);
            return res.status(500).json({ error: error.message });
          }
          
          console.log('Payments found successfully, count:', data?.length || 0);
          return res.json(data || []);
        }

        if (req.query.id) {
          console.log('Getting specific payment by ID:', req.query.id);
          const { data, error } = await supabase
            .from('pagamentos')
            .select('*')
            .eq('id', req.query.id)
            .single();
          
          if (error) {
            console.error('Error fetching specific payment:', error);
            return res.status(404).json({ error: error.message });
          }
          
          console.log('Payment found successfully');
          return res.json(data);
        }

        console.log('Getting all payments...');
        
        // BACKUP FUNCIONAL: Queries separadas + combinação JavaScript
        console.log('📊 Buscando dados separados como no backup funcional...');
        
        // 1. Buscar todos os pagamentos
        const { data: pagamentos, error: pagamentosError } = await supabase
          .from('pagamentos')
          .select('*');
        
        if (pagamentosError) {
          console.error('Error fetching payments:', pagamentosError);
          return res.status(500).json({ error: pagamentosError.message });
        }
        
        // 2. Buscar todas as vendas separadamente
        const { data: vendas, error: vendasError } = await supabase
          .from('vendas')
          .select('*');
          
        if (vendasError) {
          console.error('Error fetching vendas for payments:', vendasError);
          return res.status(500).json({ error: vendasError.message });
        }
        
        // 3. Buscar todos os clientes separadamente  
        const { data: clientes, error: clientesError } = await supabase
          .from('clientes')
          .select('telefone, nome');
          
        if (clientesError) {
          console.error('Error fetching clientes for payments:', clientesError);
          return res.status(500).json({ error: clientesError.message });
        }
        
        console.log(`🔍 Dados obtidos: ${pagamentos?.length || 0} pagamentos, ${vendas?.length || 0} vendas, ${clientes?.length || 0} clientes`);
        
        // 4. Combinar os dados em JavaScript (como no backup funcional)
        const pagamentosComDetalhes = pagamentos?.map(pagamento => {
          const venda = vendas?.find(v => v.id === pagamento.venda_id);
          const cliente = clientes?.find(c => c.telefone === venda?.cliente_telefone);
          
          return {
            ...pagamento,
            cliente_nome: cliente?.nome || 'Cliente não encontrado',
            cliente_telefone: cliente?.telefone,
            venda_valor_total: venda?.valor_total,
            venda_valor_pago: venda?.valor_pago,
            venda_data_vencimento: venda?.data_vencimento
          };
        });
        
        console.log('✅ Pagamentos com detalhes processados:', pagamentosComDetalhes?.length || 0);
        console.log('🔍 Exemplo de dados combinados:', pagamentosComDetalhes?.[0] ? {
          id: pagamentosComDetalhes[0].id.substring(0, 8),
          cliente_nome: pagamentosComDetalhes[0].cliente_nome,
          valor: pagamentosComDetalhes[0].valor
        } : 'Nenhum pagamento encontrado');
        
        return res.json(pagamentosComDetalhes || []);

      } catch (getError) {
        console.error('Exception during GET:', getError);
        return res.status(500).json({ error: 'Erro ao buscar pagamentos', details: getError.message });
      }
    }

    if (req.method === 'POST') {
      try {
        console.log('Executing POST request...');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { data, error } = await supabase
          .from('pagamentos')
          .insert([req.body])
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting payment:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Payment created successfully');
        return res.status(201).json(data);

      } catch (postError) {
        console.error('Exception during POST:', postError);
        return res.status(500).json({ error: 'Erro ao criar pagamento', details: postError.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        console.log('Executing PUT request...');
        const { id } = req.query;
        console.log('Updating payment with ID:', id);
        console.log('Update data:', JSON.stringify(req.body, null, 2));
        
        const { data, error } = await supabase
          .from('pagamentos')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating payment:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Payment updated successfully');
        return res.json(data);

      } catch (putError) {
        console.error('Exception during PUT:', putError);
        return res.status(500).json({ error: 'Erro ao atualizar pagamento', details: putError.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        console.log('Executing DELETE request...');
        const { id } = req.query;
        console.log('Deleting payment with ID:', id);
        
        const { error } = await supabase
          .from('pagamentos')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting payment:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Payment deleted successfully');
        return res.status(204).end();

      } catch (deleteError) {
        console.error('Exception during DELETE:', deleteError);
        return res.status(500).json({ error: 'Erro ao deletar pagamento', details: deleteError.message });
      }
    }

    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('=== ERRO GERAL NA FUNÇÃO PAGAMENTOS ===');
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
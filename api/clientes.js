module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== INÍCIO DA FUNÇÃO CLIENTES ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Check environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log('Environment check:');
    console.log('- VITE_SUPABASE_URL:', !!process.env.VITE_SUPABASE_URL);
    console.log('- SUPABASE_URL:', !!process.env.SUPABASE_URL);
    console.log('- VITE_SUPABASE_ANON_KEY:', !!process.env.VITE_SUPABASE_ANON_KEY);
    console.log('- SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
    console.log('- Final supabaseUrl:', !!supabaseUrl);
    console.log('- Final supabaseKey:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({ 
        error: 'Configuração do servidor incompleta',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
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
        
        if (req.query.telefone) {
          console.log('Getting specific client by phone:', req.query.telefone);
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('telefone', req.query.telefone)
            .single();
          
          if (error) {
            console.error('Error fetching specific client:', error);
            return res.status(404).json({ error: error.message });
          }
          
          console.log('Client found successfully');
          return res.json(data);
        }

        console.log('Getting all clients...');
        const { data, error } = await supabase.from('clientes').select('*');
        
        if (error) {
          console.error('Error fetching clients:', error);
          return res.status(500).json({ error: error.message });
        }
        
        console.log('Clients fetched successfully, count:', data?.length || 0);
        return res.json(data || []);

      } catch (getError) {
        console.error('Exception during GET:', getError);
        return res.status(500).json({ error: 'Erro ao buscar clientes', details: getError.message });
      }
    }

    if (req.method === 'POST') {
      try {
        console.log('Executing POST request...');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { data, error } = await supabase
          .from('clientes')
          .insert([req.body])
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting client:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Client created successfully');
        return res.status(201).json(data);

      } catch (postError) {
        console.error('Exception during POST:', postError);
        return res.status(500).json({ error: 'Erro ao criar cliente', details: postError.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        console.log('Executing PUT request...');
        const { telefone } = req.query;
        console.log('Updating client with phone:', telefone);
        console.log('Update data:', JSON.stringify(req.body, null, 2));
        
        const { data, error } = await supabase
          .from('clientes')
          .update(req.body)
          .eq('telefone', telefone)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating client:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Client updated successfully');
        return res.json(data);

      } catch (putError) {
        console.error('Exception during PUT:', putError);
        return res.status(500).json({ error: 'Erro ao atualizar cliente', details: putError.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        console.log('Executing DELETE request...');
        const { telefone } = req.query;
        console.log('Deleting client with phone:', telefone);
        
        const { error } = await supabase
          .from('clientes')
          .delete()
          .eq('telefone', telefone);
        
        if (error) {
          console.error('Error deleting client:', error);
          return res.status(400).json({ error: error.message });
        }
        
        console.log('Client deleted successfully');
        return res.status(204).end();

      } catch (deleteError) {
        console.error('Exception during DELETE:', deleteError);
        return res.status(500).json({ error: 'Erro ao deletar cliente', details: deleteError.message });
      }
    }

    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('=== ERRO GERAL NA FUNÇÃO ===');
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
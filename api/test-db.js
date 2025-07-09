module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== TESTE DE CONEXÃO COM BANCO ===');
    
    // Check environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log('Environment check:');
    console.log('- supabaseUrl:', !!supabaseUrl);
    console.log('- supabaseKey:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Configuração do Supabase incompleta',
        details: { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey }
      });
    }

    // Import Supabase
    const { createClient } = require('@supabase/supabase-js');
    console.log('✓ Supabase module imported');

    // Create client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Supabase client created');

    // Test simple connection (check if we can at least connect)
    console.log('Testing basic connection...');
    
    // Try to query a system table or make a simple health check
    try {
      // This will test the connection without requiring authentication
      const { data, error } = await supabase
        .from('clientes')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Database query error:', error);
        return res.json({
          status: 'connection_ok_but_query_failed',
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }
      
      console.log('✓ Database query successful');
      return res.json({
        status: 'success',
        message: 'Conexão com banco de dados funcionando',
        count: data,
        url: supabaseUrl.substring(0, 30) + '...',
        timestamp: new Date().toISOString()
      });
      
    } catch (queryError) {
      console.error('Query exception:', queryError);
      return res.json({
        status: 'connection_ok_but_query_exception',
        error: queryError.message,
        name: queryError.name,
        message: 'Conexão criada mas query falhou'
      });
    }

  } catch (error) {
    console.error('=== ERRO NO TESTE DE BANCO ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Erro no teste de conexão', 
      details: error.message,
      name: error.name
    });
  }
}; 
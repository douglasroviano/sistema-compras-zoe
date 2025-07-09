module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('=== FUNÇÃO DE LOGIN ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Check environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Configuração do servidor incompleta',
        details: { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey }
      });
    }

    // Import Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Supabase client created');

    // Get email and password from request
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios',
        provided: { hasEmail: !!email, hasPassword: !!password }
      });
    }

    console.log('Attempting login for email:', email);

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ 
        error: 'Erro de autenticação',
        details: error.message,
        code: error.status
      });
    }

    if (!data.user || !data.session) {
      console.error('No user or session returned');
      return res.status(401).json({ 
        error: 'Login falhou - dados incompletos'
      });
    }

    console.log('✓ Login successful for user:', data.user.email);
    console.log('✓ Token generated, expires at:', data.session.expires_at);

    // Return success with token
    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: data.user.email_confirmed_at ? true : false
      },
      session: {
        access_token: data.session.access_token,
        token_type: data.session.token_type,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
        refresh_token: data.session.refresh_token
      }
    });

  } catch (error) {
    console.error('=== ERRO NA FUNÇÃO LOGIN ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Erro interno no login', 
      details: error.message,
      name: error.name
    });
  }
}; 
module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== INÍCIO DA FUNÇÃO TEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const testResults = {
      timestamp: new Date().toISOString(),
      method: req.method,
      nodeVersion: process.version,
      platform: process.platform,
      environment: 'vercel',
      checks: {}
    };

    // Check 1: Basic Node.js functionality
    try {
      testResults.checks.nodeBasic = {
        status: 'ok',
        version: process.version
      };
      console.log('✓ Node.js basic check passed');
    } catch (error) {
      testResults.checks.nodeBasic = {
        status: 'error',
        error: error.message
      };
      console.error('✗ Node.js basic check failed:', error);
    }

    // Check 2: Environment variables
    try {
      const envCheck = {
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      };
      
      testResults.checks.environment = {
        status: 'ok',
        variables: envCheck
      };
      console.log('✓ Environment variables check:', envCheck);
    } catch (error) {
      testResults.checks.environment = {
        status: 'error',
        error: error.message
      };
      console.error('✗ Environment variables check failed:', error);
    }

    // Check 3: Module imports
    try {
      console.log('Testing module imports...');
      
      // Test basic Node modules
      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');
      
      testResults.checks.modules = {
        status: 'ok',
        basicModules: ['fs', 'path', 'crypto']
      };
      console.log('✓ Basic Node modules available');
      
      // Test Supabase module
      try {
        const supabaseModule = require('@supabase/supabase-js');
        testResults.checks.modules.supabase = {
          status: 'ok',
          hasCreateClient: typeof supabaseModule.createClient === 'function'
        };
        console.log('✓ Supabase module available');
      } catch (supabaseError) {
        testResults.checks.modules.supabase = {
          status: 'error',
          error: supabaseError.message
        };
        console.error('✗ Supabase module failed:', supabaseError);
      }
      
    } catch (error) {
      testResults.checks.modules = {
        status: 'error',
        error: error.message
      };
      console.error('✗ Module imports check failed:', error);
    }

    // Check 4: Async/await functionality
    try {
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      await sleep(10); // 10ms delay
      
      testResults.checks.async = {
        status: 'ok',
        message: 'Async/await working correctly'
      };
      console.log('✓ Async/await check passed');
    } catch (error) {
      testResults.checks.async = {
        status: 'error',
        error: error.message
      };
      console.error('✗ Async/await check failed:', error);
    }

    // Check 5: Simple Supabase connection test (if credentials available)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        console.log('Testing Supabase connection...');
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Simple health check - just create client, don't make requests
        testResults.checks.supabaseConnection = {
          status: 'ok',
          message: 'Supabase client created successfully',
          url: supabaseUrl.substring(0, 20) + '...',
          hasKey: !!supabaseKey
        };
        console.log('✓ Supabase client creation successful');
        
      } catch (supabaseError) {
        testResults.checks.supabaseConnection = {
          status: 'error',
          error: supabaseError.message
        };
        console.error('✗ Supabase connection test failed:', supabaseError);
      }
    } else {
      testResults.checks.supabaseConnection = {
        status: 'warning',
        message: 'Supabase credentials not available for testing'
      };
      console.log('⚠ Supabase credentials not available');
    }

    // Check 6: Request handling
    try {
      const requestInfo = {
        method: req.method,
        url: req.url,
        hasBody: !!req.body,
        hasQuery: !!req.query && Object.keys(req.query).length > 0,
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type'],
        authorization: !!req.headers.authorization
      };
      
      testResults.checks.requestHandling = {
        status: 'ok',
        requestInfo
      };
      console.log('✓ Request handling check passed');
    } catch (error) {
      testResults.checks.requestHandling = {
        status: 'error',
        error: error.message
      };
      console.error('✗ Request handling check failed:', error);
    }

    // Summary
    const failedChecks = Object.entries(testResults.checks)
      .filter(([, check]) => check.status === 'error')
      .map(([name]) => name);
    
    const warningChecks = Object.entries(testResults.checks)
      .filter(([, check]) => check.status === 'warning')
      .map(([name]) => name);

    testResults.summary = {
      totalChecks: Object.keys(testResults.checks).length,
      passed: Object.keys(testResults.checks).length - failedChecks.length - warningChecks.length,
      failed: failedChecks.length,
      warnings: warningChecks.length,
      failedChecks,
      warningChecks,
      overall: failedChecks.length === 0 ? 'PASS' : 'FAIL'
    };

    console.log('=== RESULTADO DOS TESTES ===');
    console.log(`Total: ${testResults.summary.totalChecks}`);
    console.log(`Passou: ${testResults.summary.passed}`);
    console.log(`Falhou: ${testResults.summary.failed}`);
    console.log(`Avisos: ${testResults.summary.warnings}`);
    console.log(`Status geral: ${testResults.summary.overall}`);
    if (failedChecks.length > 0) {
      console.log(`Falhas: ${failedChecks.join(', ')}`);
    }
    console.log('=== FIM DOS TESTES ===');

    return res.json(testResults);

  } catch (error) {
    console.error('=== ERRO CRÍTICO NA FUNÇÃO TEST ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== FIM DO ERRO CRÍTICO ===');
    
    return res.status(500).json({ 
      error: 'Erro crítico no sistema', 
      details: error.message,
      name: error.name,
      stack: error.stack
    });
  }
}; 
// Vercel serverless function - catches all API routes
// Minimal handler to test if basic setup works

export default async (req, res) => {
  console.log('[VERCEL HANDLER] Basic handler called', {
    method: req.method,
    url: req.url,
    timestamp: Date.now()
  });
  
  // Test if we can import the server
  try {
    console.log('[VERCEL HANDLER] Attempting to import server...');
    const serverModule = await import('../server/server.js');
    console.log('[VERCEL HANDLER] Server module imported', {
      hasDefault: !!serverModule.default,
      keys: Object.keys(serverModule)
    });
    
    const server = serverModule.default || serverModule;
    console.log('[VERCEL HANDLER] Server obtained', {
      type: typeof server,
      isFunction: typeof server === 'function'
    });
    
    if (typeof server === 'function') {
      return server(req, res);
    } else {
      return res.status(500).json({ 
        error: 'Server is not a function',
        details: `Server type: ${typeof server}`
      });
    }
  } catch (importError: any) {
    console.error('[VERCEL HANDLER] Import error:', {
      message: importError?.message,
      stack: importError?.stack?.substring(0, 1000),
      name: importError?.name
    });
    
    return res.status(500).json({ 
      error: 'Failed to import server',
      details: importError?.message || String(importError),
      stack: importError?.stack?.substring(0, 500)
    });
  }
};

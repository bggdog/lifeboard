// Vercel serverless function - catches all API routes
// Use dynamic import to catch module loading errors

let serverCache = null;

export default async (req, res) => {
  console.log('[VERCEL HANDLER] Request received', {
    method: req.method,
    url: req.url,
    path: req.path
  });
  
  try {
    if (!serverCache) {
      console.log('[VERCEL HANDLER] Loading server module...');
      const serverModule = await import('../server/server.js');
      serverCache = serverModule.default;
      console.log('[VERCEL HANDLER] Server loaded:', {
        type: typeof serverCache,
        isFunction: typeof serverCache === 'function'
      });
    }
    
    if (typeof serverCache === 'function') {
      return serverCache(req, res);
    } else {
      return res.status(500).json({
        error: 'Server is not a function',
        details: `Type: ${typeof serverCache}`
      });
    }
  } catch (error: any) {
    console.error('[VERCEL HANDLER] CRITICAL ERROR:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    return res.status(500).json({
      error: 'A server error has occurred',
      details: error?.message || String(error),
      type: error?.name
    });
  }
};

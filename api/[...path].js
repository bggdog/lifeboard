// Vercel serverless function - catches all API routes
// This allows Express routes to work as Vercel serverless functions

// Note: Import path needs to be relative to this file
// Use dynamic import to handle potential module loading errors
let serverPromise;

async function getServer() {
  if (!serverPromise) {
    serverPromise = import('../server/server.js').then(module => {
      console.log('[VERCEL HANDLER] Server imported successfully');
      return module.default || module;
    }).catch(err => {
      console.error('[VERCEL HANDLER] Failed to import server:', err);
      throw err;
    });
  }
  return serverPromise;
}

// Export the Express app as a serverless function
// Vercel will call this handler for all /api/* routes
export default async (req, res) => {
  // #region agent log
  console.log('[VERCEL HANDLER] Request received', {
    method: req.method,
    url: req.url,
    path: req.path,
    headers: Object.keys(req.headers || {}),
    hasBody: !!req.body,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run2',
    hypothesisId: 'A'
  });
  // #endregion
  
  try {
    const server = await getServer();
    // #region agent log
    console.log('[VERCEL HANDLER] Server loaded, calling handler', {
      hasServer: !!server,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run2',
      hypothesisId: 'A'
    });
    // #endregion
    return server(req, res);
  } catch (error: any) {
    // #region agent log
    console.error('[VERCEL HANDLER] Error', {
      error: error?.message,
      stack: error?.stack?.substring(0, 500),
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run2',
      hypothesisId: 'A'
    });
    // #endregion
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'A server error has occurred', 
        details: error?.message || String(error) 
      });
    }
  }
};

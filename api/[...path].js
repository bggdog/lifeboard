// Vercel serverless function - catches all API routes
// This allows Express routes to work as Vercel serverless functions

// Note: Import path needs to be relative to this file
import server from '../server/server.js';

// Export the Express app as a serverless function
// Vercel will call this handler for all /api/* routes
// Express apps work directly as Vercel handlers
export default async (req, res) => {
  // #region agent log
  console.log('[VERCEL HANDLER] Request received', {
    method: req.method,
    url: req.url,
    path: req.path,
    headers: Object.keys(req.headers),
    hasBody: !!req.body,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run2',
    hypothesisId: 'A'
  });
  // #endregion
  try {
    return server(req, res);
  } catch (error: any) {
    // #region agent log
    console.error('[VERCEL HANDLER] Error in handler', {
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

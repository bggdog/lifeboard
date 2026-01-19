// Vercel serverless function - catches all API routes
// This allows Express routes to work as Vercel serverless functions

// Note: Import path needs to be relative to this file
import server from '../server/server.js';

// Export the Express app as a serverless function
// Vercel will call this handler for all /api/* routes
// Wrap in a handler to catch any initialization errors
export default async (req, res) => {
  try {
    // Handle the request with the Express app
    return server(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      error: 'A server error has occurred', 
      details: error?.message || String(error) 
    });
  }
};

// Vercel serverless function - catches all API routes
// This allows Express routes to work as Vercel serverless functions

// Note: Import path needs to be relative to this file
import server from '../server/server.js';

// Export the Express app as a serverless function
// Vercel will call this handler for all /api/* routes
// Express apps work directly as Vercel handlers
export default server;

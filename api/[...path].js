// Vercel serverless function - catches all API routes
// Import server at module level (Vercel caches this)
import server from '../server/server.js';

// Export the Express app directly
// Vercel will call this handler for all /api/* routes
export default server;

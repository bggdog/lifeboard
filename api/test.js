// Minimal test endpoint to verify Vercel function works
export default async (req, res) => {
  console.log('[TEST] Test endpoint called');
  return res.json({ 
    status: 'ok', 
    message: 'Test endpoint works',
    timestamp: Date.now()
  });
};

// functions/get-env.js
// This function securely exposes selected environment variables to the client

exports.handler = async function(event, context) {
  // Only expose specific environment variables that are needed client-side
  // and are safe to expose (public keys, URLs, but not private keys)
  const clientEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  };
  
  // Check if environment variables are available
  const missingVars = [];
  if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
  if (!process.env.SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
  
  // Log missing variables for debugging
  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('All required environment variables are available');
  }
  
  // Add the status for client-side debugging 
  clientEnv.status = missingVars.length === 0 ? 'success' : 'missing_vars';
  clientEnv.missing = missingVars;
  
  // Return them with CORS headers
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
    },
    body: JSON.stringify(clientEnv)
  };
}; 
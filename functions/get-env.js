// functions/get-env.js
// This function securely exposes selected environment variables to the client

exports.handler = async function(event, context) {
  // Only expose specific environment variables that are needed client-side
  // and are safe to expose (public keys, URLs, but not private keys)
  const clientEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  };
  
  // Return them with CORS headers
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify(clientEnv)
  };
}; 
// lib/supabase.js
// Get Supabase credentials from window.ENV
function getSupabaseCredentials() {
  // First try to get from window.ENV (set by template processing)
  if (typeof window !== 'undefined' && window.ENV) {
    return {
      supabaseUrl: window.ENV.SUPABASE_URL,
      supabaseAnonKey: window.ENV.SUPABASE_ANON_KEY
    };
  }
  
  // Fallback to meta tags (for compatibility)
  if (typeof document !== 'undefined') {
    const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
    const supabaseAnonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content;
    
    if (supabaseUrl && supabaseAnonKey) {
      return { supabaseUrl, supabaseAnonKey };
    }
  }
  
  // Fallback to hardcoded values (not recommended for production)
  console.warn('Using fallback Supabase credentials. This is not recommended for production.');
  return {
    supabaseUrl: 'https://tadqfmqlqlahoknivhds.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHFmbXFscWxhaG9rbml2aGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTY0MTAsImV4cCI6MjA2MTg5MjQxMH0.6afLHxoHlX3U3JzsqX6d61mpmiu3bICkbHgb1XDY7V0'
  };
}

// Create a global variable to hold the Supabase client
let supabase;

// Initialize the Supabase client
async function initSupabase() {
  if (!supabase) {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found');
      }
      
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
    }
  }
  return supabase;
}

// Initialize immediately
(async () => {
  try {
    supabase = await initSupabase();
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
  }
})();

// Export the supabase client directly
export { supabase };

// Export auth functions
export const auth = {
  signUp: async (email, password) => {
    await initSupabase();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
  },

  signIn: async (email, password) => {
    await initSupabase();
    return supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signOut: async () => {
    await initSupabase();
    return supabase.auth.signOut();
  },

  getUser: async () => {
    await initSupabase();
    return supabase.auth.getUser();
  },

  getSession: async () => {
    await initSupabase();
    return supabase.auth.getSession();
  },

  onAuthStateChange: async (callback) => {
    await initSupabase();
    return supabase.auth.onAuthStateChange(callback);
  }
}; 
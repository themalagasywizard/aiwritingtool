// lib/supabase.js
// IMPORTANT: Replace these values with your actual Supabase project URL and anon key
// For local development, copy env.example to .env and fill in your actual values
// For production, set these values in your Netlify environment variables
const SUPABASE_URL = typeof process !== 'undefined' && process.env.SUPABASE_URL 
  ? process.env.SUPABASE_URL 
  : 'https://your-project-url.supabase.co';

const SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY 
  ? process.env.SUPABASE_ANON_KEY 
  : 'your-anon-key';

// Create a global variable to hold the Supabase client
let supabase;

// Initialize the Supabase client
async function initSupabase() {
  if (!supabase) {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Supabase client initialized");
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      // Provide a fallback client for development that doesn't throw errors
      if (SUPABASE_URL === 'https://your-project-url.supabase.co') {
        console.warn("Using mock Supabase client. Please set up your Supabase project and update the configuration.");
        // Create a mock supabase client for development
        supabase = createMockSupabaseClient();
      }
    }
  }
  return supabase;
}

// Create a mock Supabase client for development
function createMockSupabaseClient() {
  return {
    auth: {
      signUp: () => Promise.resolve({ data: null, error: new Error('Using mock client. Please configure Supabase.') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Using mock client. Please configure Supabase.') }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback) => {
        console.warn('Auth state change not available in mock client');
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
  };
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
      password
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
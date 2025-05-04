// lib/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Get Supabase URL and Anon Key from environment variables
const SUPABASE_URL = typeof process !== 'undefined' && process.env.SUPABASE_URL 
  ? process.env.SUPABASE_URL 
  : window.SUPABASE_URL;

const SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY 
  ? process.env.SUPABASE_ANON_KEY 
  : window.SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export auth functions for convenience
export const auth = {
  signUp: async (email, password) => {
    return supabase.auth.signUp({
      email,
      password
    });
  },

  signIn: async (email, password) => {
    return supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signOut: async () => {
    return supabase.auth.signOut();
  },

  getUser: async () => {
    return supabase.auth.getUser();
  },

  getSession: async () => {
    return supabase.auth.getSession();
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 
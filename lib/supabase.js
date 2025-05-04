// lib/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Get Supabase URL and Anon Key from environment variables
const SUPABASE_URL = 'https://aibookwriting.supabase.co';  // Your Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcGJtbXBxbmxqbmxwbXJxbmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MjI0MDAsImV4cCI6MjAyNTM5ODQwMH0.YourSupabaseAnonKey';  // Your Supabase anon key

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
// lib/supabase.js
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Create Supabase client
let supabase;

async function initSupabase() {
    if (!supabase) {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

// Initialize and export Supabase client
const supabasePromise = initSupabase();

// Export an async function that ensures Supabase is initialized
export async function getSupabase() {
    return await supabasePromise;
}

// Export auth functions
export const auth = {
    signUp: async (email, password) => {
        const client = await getSupabase();
        return client.auth.signUp({
            email,
            password
        });
    },

    signIn: async (email, password) => {
        const client = await getSupabase();
        return client.auth.signInWithPassword({
            email,
            password
        });
    },

    signOut: async () => {
        const client = await getSupabase();
        return client.auth.signOut();
    },

    getUser: async () => {
        const client = await getSupabase();
        return client.auth.getUser();
    },

    getSession: async () => {
        const client = await getSupabase();
        return client.auth.getSession();
    },

    onAuthStateChange: async (callback) => {
        const client = await getSupabase();
        return client.auth.onAuthStateChange(callback);
    }
}; 
// lib/supabase.js

// Get environment variables from window.ENV
const getEnvVars = () => {
    if (!window.ENV) {
        throw new Error('Environment variables not found. Make sure the build process completed successfully.');
    }

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.ENV;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration not found. Make sure environment variables are set.');
    }

    return { supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY };
};

// Create a global variable to hold the Supabase client
let supabaseInstance = null;

// Initialize the Supabase client
async function initSupabase() {
    if (!supabaseInstance) {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const { supabaseUrl, supabaseAnonKey } = getEnvVars();
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
        } catch (error) {
            console.error("Error initializing Supabase client:", error);
            throw error;
        }
    }
    return supabaseInstance;
}

// Export auth functions that ensure Supabase is initialized
export const auth = {
    signUp: async (email, password, options = {}) => {
        const client = await initSupabase();
        return client.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                ...options
            }
        });
    },

    signIn: async (email, password) => {
        const client = await initSupabase();
        return client.auth.signInWithPassword({
            email,
            password
        });
    },

    signOut: async () => {
        const client = await initSupabase();
        return client.auth.signOut();
    },

    getUser: async () => {
        const client = await initSupabase();
        return client.auth.getUser();
    },

    getSession: async () => {
        const client = await initSupabase();
        return client.auth.getSession();
    },

    onAuthStateChange: async (callback) => {
        const client = await initSupabase();
        return client.auth.onAuthStateChange(callback);
    }
};

// Initialize immediately and export the instance
export const supabase = await initSupabase(); 
// lib/supabase.js

// Create a script element for loading Supabase
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
document.head.appendChild(supabaseScript);

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
const initSupabase = new Promise((resolve) => {
    supabaseScript.onload = () => {
        try {
            const { supabaseUrl, supabaseAnonKey } = getEnvVars();
            supabaseInstance = supabase.createClient(supabaseUrl, supabaseAnonKey);
            resolve(supabaseInstance);
        } catch (error) {
            console.error("Error initializing Supabase client:", error);
            throw error;
        }
    };
});

// Export auth functions that ensure Supabase is initialized
export const auth = {
    signUp: async (email, password, options = {}) => {
        const client = await initSupabase;
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
        const client = await initSupabase;
        return client.auth.signInWithPassword({
            email,
            password
        });
    },

    signOut: async () => {
        const client = await initSupabase;
        return client.auth.signOut();
    },

    getUser: async () => {
        const client = await initSupabase;
        return client.auth.getUser();
    },

    getSession: async () => {
        const client = await initSupabase;
        return client.auth.getSession();
    },

    onAuthStateChange: async (callback) => {
        const client = await initSupabase;
        return client.auth.onAuthStateChange(callback);
    }
};

// Export initialized client
export const supabase = await initSupabase; 
// lib/supabase.js

// Create a script element for loading Supabase
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
document.head.appendChild(supabaseScript);

// Initialize Supabase client after script loads
let supabaseInstance = null;

const initSupabase = new Promise((resolve) => {
    supabaseScript.onload = () => {
        // Get environment variables from meta tags
        const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
        const supabaseAnonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Supabase configuration not found. Make sure meta tags are present.');
            return;
        }

        // Create Supabase client
        supabaseInstance = supabase.createClient(supabaseUrl, supabaseAnonKey);
        resolve(supabaseInstance);
    };
});

// Export initialized client
export const supabase = await initSupabase;

// Export auth functions
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
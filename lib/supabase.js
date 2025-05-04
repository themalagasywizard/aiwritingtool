// lib/supabase.js

// Import Supabase client from CDN
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
document.head.appendChild(supabaseScript);

// Wait for Supabase to load
const waitForSupabase = new Promise((resolve) => {
    supabaseScript.onload = () => {
        const { createClient } = supabase;
        const supabaseClient = createClient(
            'https://your-project-url.supabase.co',  // Replace with your Supabase project URL
            'your-anon-key'  // Replace with your Supabase anon key
        );
        resolve(supabaseClient);
    };
});

// Export Supabase client
export const supabase = await waitForSupabase;

// Export auth functions for convenience
export const auth = {
    signUp: async (email, password, options = {}) => {
        return supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                ...options
            }
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
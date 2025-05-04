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
const initSupabase = new Promise((resolve, reject) => {
    // Check if Supabase is already loaded
    if (window.supabase) {
        try {
            const { supabaseUrl, supabaseAnonKey } = getEnvVars();
            supabaseInstance = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            resolve(supabaseInstance);
        } catch (error) {
            console.error("Error initializing Supabase client:", error);
            reject(error);
        }
    } else {
        // Wait for script to load
        supabaseScript.onload = () => {
            try {
                // Make sure window.supabase exists
                if (!window.supabase) {
                    throw new Error("Supabase library not available after script load");
                }
                
                const { supabaseUrl, supabaseAnonKey } = getEnvVars();
                supabaseInstance = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
                resolve(supabaseInstance);
            } catch (error) {
                console.error("Error initializing Supabase client:", error);
                reject(error);
            }
        };
        
        // Handle script load error
        supabaseScript.onerror = (error) => {
            console.error("Failed to load Supabase script:", error);
            reject(new Error("Failed to load Supabase script"));
        };
    }
});

// Export auth functions that ensure Supabase is initialized
export const auth = {
    signUp: async (email, password, options = {}) => {
        try {
            const client = await initSupabase;
            return client.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    ...options
                }
            });
        } catch (error) {
            console.error("Error during signUp:", error);
            return { error };
        }
    },

    signIn: async (email, password) => {
        try {
            const client = await initSupabase;
            return client.auth.signInWithPassword({
                email,
                password
            });
        } catch (error) {
            console.error("Error during signIn:", error);
            return { error };
        }
    },

    signOut: async () => {
        try {
            const client = await initSupabase;
            return client.auth.signOut();
        } catch (error) {
            console.error("Error during signOut:", error);
            return { error };
        }
    },

    getUser: async () => {
        try {
            const client = await initSupabase;
            return client.auth.getUser();
        } catch (error) {
            console.error("Error getting user:", error);
            return { error };
        }
    },

    getSession: async () => {
        try {
            const client = await initSupabase;
            return client.auth.getSession();
        } catch (error) {
            console.error("Error getting session:", error);
            return { error };
        }
    },

    onAuthStateChange: async (callback) => {
        try {
            const client = await initSupabase;
            return client.auth.onAuthStateChange(callback);
        } catch (error) {
            console.error("Error setting up auth state change:", error);
            return { error };
        }
    }
};

// Export an async function to get the Supabase client
export const getSupabase = async () => {
    try {
        return await initSupabase;
    } catch (error) {
        console.error("Error getting Supabase client:", error);
        throw error;
    }
}; 
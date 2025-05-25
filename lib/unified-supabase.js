// lib/unified-supabase.js
// Unified Supabase client to prevent multiple instances

// Global singleton instance
let supabaseClient = null;
let isInitialized = false;

// Get Supabase credentials
function getSupabaseCredentials() {
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  
  // Try to get from window.ENV (set by template processing)
  if (typeof window !== 'undefined' && window.ENV) {
    supabaseUrl = window.ENV.SUPABASE_URL;
    supabaseAnonKey = window.ENV.SUPABASE_ANON_KEY;
  }
  
  // If not found, try to get from meta tags
  if ((!supabaseUrl || !supabaseAnonKey) && typeof document !== 'undefined') {
    const urlMeta = document.querySelector('meta[name="supabase-url"]');
    const keyMeta = document.querySelector('meta[name="supabase-anon-key"]');
    
    if (urlMeta && urlMeta.content) supabaseUrl = urlMeta.content;
    if (keyMeta && keyMeta.content) supabaseAnonKey = keyMeta.content;
  }
  
  return { supabaseUrl, supabaseAnonKey };
}

// Initialize Supabase client (singleton pattern)
async function getSupabaseClient() {
  if (supabaseClient && isInitialized) {
    return supabaseClient;
  }
  
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
    
    // Check if we have valid credentials
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('<%=') || supabaseAnonKey.includes('<%=')) {
      console.log('Using mock Supabase client for development');
      return createMockClient();
    }
    
    // Import Supabase client
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    
    // Create the singleton client
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'kalligram_auth_token'
      }
    });
    
    isInitialized = true;
    console.log('Supabase client initialized successfully');
    
    return supabaseClient;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return createMockClient();
  }
}

// Create mock client for development
function createMockClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async ({ email, password }) => {
        const user = { id: 'mock-user-id', email };
        return { data: { user, session: { user } }, error: null };
      },
      signUp: async ({ email, password }) => {
        const user = { id: 'mock-user-id', email };
        return { data: { user }, error: null };
      },
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: null, unsubscribe: () => {} })
    },
    from: (table) => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null })
    })
  };
}

// Export unified auth functions
export const auth = {
  signUp: async (email, password) => {
    const client = await getSupabaseClient();
    return client.auth.signUp({ email, password });
  },

  signIn: async (email, password) => {
    const client = await getSupabaseClient();
    return client.auth.signInWithPassword({ email, password });
  },

  signOut: async () => {
    const client = await getSupabaseClient();
    return client.auth.signOut();
  },

  getUser: async () => {
    const client = await getSupabaseClient();
    return client.auth.getUser();
  },

  getSession: async () => {
    const client = await getSupabaseClient();
    return client.auth.getSession();
  }
};

// Export unified database functions
export const projects = {
  getAll: async () => {
    try {
      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return { data: [], error: null };

      return client.from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    } catch (error) {
      return { data: [], error };
    }
  },

  getById: async (projectId) => {
    try {
      const client = await getSupabaseClient();
      return client.from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
    } catch (error) {
      return { data: null, error };
    }
  },

  create: async (title, description = '') => {
    try {
      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return { data: null, error: new Error('User not authenticated') };

      return client.from('projects')
        .insert([{
          user_id: user.id,
          title,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
    } catch (error) {
      return { data: null, error };
    }
  },

  update: async (projectId, updates) => {
    try {
      const client = await getSupabaseClient();
      return client.from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .select();
    } catch (error) {
      return { data: null, error };
    }
  }
};

export const chapters = {
  getByProject: async (projectId) => {
    try {
      const client = await getSupabaseClient();
      return client.from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });
    } catch (error) {
      return { data: [], error };
    }
  },

  create: async (projectId, title, content = '', orderIndex = 0) => {
    try {
      const client = await getSupabaseClient();
      return client.from('chapters')
        .insert([{
          project_id: projectId,
          title,
          content,
          order_index: orderIndex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
    } catch (error) {
      return { data: null, error };
    }
  },

  update: async (chapterId, updates) => {
    try {
      const client = await getSupabaseClient();
      return client.from('chapters')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', chapterId)
        .select();
    } catch (error) {
      return { data: null, error };
    }
  },

  updateOrder: async (chapterUpdates) => {
    try {
      const client = await getSupabaseClient();
      // Batch update chapter orders
      const promises = chapterUpdates.map(({ id, order_index }) =>
        client.from('chapters')
          .update({ order_index, updated_at: new Date().toISOString() })
          .eq('id', id)
      );
      
      await Promise.all(promises);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
};

export const characters = {
  getByProject: async (projectId) => {
    try {
      const client = await getSupabaseClient();
      return client.from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const locations = {
  getByProject: async (projectId) => {
    try {
      const client = await getSupabaseClient();
      return client.from('locations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const timelineEvents = {
  getByProject: async (projectId) => {
    try {
      const client = await getSupabaseClient();
      return client.from('timeline_events')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const profiles = {
  get: async () => {
    try {
      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return { data: null, error: new Error('User not authenticated') };

      return client.from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    } catch (error) {
      return { data: null, error };
    }
  }
};

// Make client available globally (for compatibility)
window.getSupabaseClient = getSupabaseClient; 
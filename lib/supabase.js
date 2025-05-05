// lib/supabase.js
// Get Supabase credentials from window.ENV
async function getSupabaseCredentials() {
  // First try to get from window.ENV (set by template processing)
  if (typeof window !== 'undefined' && window.ENV) {
    console.log("Using credentials from window.ENV");
    return {
      supabaseUrl: window.ENV.SUPABASE_URL,
      supabaseAnonKey: window.ENV.SUPABASE_ANON_KEY
    };
  }
  
  // Second, try to get from Netlify function (new method)
  if (typeof fetch !== 'undefined') {
    try {
      console.log("Attempting to fetch environment variables from Netlify function");
      const response = await fetch('/get-env');
      console.log("Fetch response status:", response.status);
      
      if (response.ok) {
        const env = await response.json();
        console.log("Environment variables received:", !!env.SUPABASE_URL, !!env.SUPABASE_ANON_KEY);
        
        if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
          return {
            supabaseUrl: env.SUPABASE_URL,
            supabaseAnonKey: env.SUPABASE_ANON_KEY
          };
        } else {
          console.warn("Empty Supabase credentials received from Netlify function");
        }
      } else {
        console.warn("Failed to fetch environment variables, status:", response.status);
      }
    } catch (error) {
      console.warn('Failed to fetch environment variables from Netlify function:', error);
    }
  }
  
  // Fallback to meta tags (for compatibility)
  if (typeof document !== 'undefined') {
    console.log("Attempting to get credentials from meta tags");
    const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
    const supabaseAnonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content;
    
    if (supabaseUrl && supabaseAnonKey) {
      console.log("Using credentials from meta tags");
      return { supabaseUrl, supabaseAnonKey };
    } else {
      console.warn("No meta tags found for Supabase credentials");
    }
  }
  
  // Direct credentials for local development (delete for production)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn('Using development hardcoded credentials. Only for local development.');
    return {
      supabaseUrl: 'https://tadqfmqlqlahoknivhds.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHFmbXFscWxhaG9rbml2aGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTY0MTAsImV4cCI6MjA2MTg5MjQxMH0.6afLHxoHlX3U3JzsqX6d61mpmiu3bICkbHgb1XDY7V0'
    };
  }
  
  // No credentials found through any method
  console.error('No Supabase credentials found through any available method');
  throw new Error('Supabase credentials not found');
}

// Create a global variable to hold the Supabase client and a flag to track initialization
let supabase = null;
let isInitializing = false;
let initPromise = null;

// Initialize the Supabase client
async function initSupabase() {
  // If we already have a client, return it
  if (supabase) {
    return supabase;
  }
  
  // If initialization is in progress, wait for it to complete
  if (isInitializing && initPromise) {
    return initPromise;
  }
  
  // Start initialization
  isInitializing = true;
  initPromise = (async () => {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const { supabaseUrl, supabaseAnonKey } = await getSupabaseCredentials();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found');
      }
      
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storageKey: 'ai_writing_tool_auth',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });

      // Try to recover session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('Failed to recover session:', sessionError);
      } else if (session) {
        console.log('Session recovered successfully');
      }
      
      return supabase;
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      throw error;
    } finally {
      isInitializing = false;
    }
  })();
  
  return initPromise;
}

// Initialize on import but don't wait for it
initSupabase().catch(error => {
  console.error("Failed to initialize Supabase on import:", error);
});

// Export the supabase client
export const getClient = () => supabase || initSupabase();

// Export auth functions
export const auth = {
  signUp: async (email, password) => {
    const client = await initSupabase();
    return client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
  },

  signIn: async (email, password) => {
    const client = await initSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.session) {
      // Store session in localStorage
      localStorage.setItem('ai_writing_tool_auth', JSON.stringify(data.session));
    }
    
    return { data, error };
  },

  signOut: async () => {
    const client = await initSupabase();
    const result = await client.auth.signOut();
    // Clear session from localStorage
    localStorage.removeItem('ai_writing_tool_auth');
    return result;
  },

  getUser: async () => {
    const client = await initSupabase();
    // First try to get session
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    
    if (sessionError) {
      console.warn('Failed to get session:', sessionError);
      return { data: { user: null }, error: sessionError };
    }
    
    if (!session) {
      return { data: { user: null }, error: new Error('No active session') };
    }
    
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

// Project Management
export const projects = {
  // Get all projects for the current user
  getAll: async () => {
    const client = await getClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { data: null, error: new Error('User not authenticated') };

    return client
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  },

  // Get a single project by ID
  getById: async (projectId) => {
    const client = await getClient();
    return client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
  },

  // Create a new project
  create: async (title, description = '') => {
    const client = await getClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { data: null, error: new Error('User not authenticated') };

    return client
      .from('projects')
      .insert([
        {
          user_id: user.id,
          title,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
  },

  // Update a project
  update: async (projectId, updates) => {
    const client = await getClient();
    return client
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select();
  },

  // Delete a project
  delete: async (projectId) => {
    const client = await getClient();
    return client
      .from('projects')
      .delete()
      .eq('id', projectId);
  }
};

// Chapter Management
export const chapters = {
  // Get all chapters for a project
  getByProject: async (projectId) => {
    const client = await getClient();
    return client
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
  },

  // Get a single chapter by ID
  getById: async (chapterId) => {
    const client = await getClient();
    return client
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
  },

  // Create a new chapter
  create: async (projectId, title, content = '', orderIndex = 0) => {
    const client = await getClient();
    return client
      .from('chapters')
      .insert([
        {
          project_id: projectId,
          title,
          content,
          order_index: orderIndex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
  },

  // Update a chapter
  update: async (chapterId, updates) => {
    const client = await getClient();
    return client
      .from('chapters')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', chapterId)
      .select();
  },

  // Update the order of chapters
  updateOrder: async (chapters) => {
    const client = await getClient();
    const updates = chapters.map(chapter => ({
      id: chapter.id,
      order_index: chapter.order_index,
      updated_at: new Date().toISOString()
    }));

    return client
      .from('chapters')
      .upsert(updates, { onConflict: 'id' });
  },

  // Delete a chapter
  delete: async (chapterId) => {
    const client = await getClient();
    return client
      .from('chapters')
      .delete()
      .eq('id', chapterId);
  }
};

// Character Management
export const characters = {
  // Get all characters for a project
  getByProject: async (projectId) => {
    const client = await getClient();
    return client
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
  },

  // Get a single character by ID
  getById: async (characterId) => {
    const client = await getClient();
    return client
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();
  },

  // Create a new character
  create: async (projectId, name, role, traits = '', backstory = '') => {
    const client = await getClient();
    return client
      .from('characters')
      .insert([
        {
          project_id: projectId,
          name,
          role,
          traits,
          backstory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
  },

  // Update a character
  update: async (characterId, updates) => {
    const client = await getClient();
    return client
      .from('characters')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId)
      .select();
  },

  // Delete a character
  delete: async (characterId) => {
    const client = await getClient();
    return client
      .from('characters')
      .delete()
      .eq('id', characterId);
  },

  // Get character relationships
  getRelationships: async (characterId) => {
    const client = await getClient();
    return client
      .from('character_relationships')
      .select('*, related_character_id(id, name, role)')
      .eq('character_id', characterId);
  },

  // Create a character relationship
  createRelationship: async (characterId, relatedCharacterId, relationshipType) => {
    const client = await getClient();
    return client
      .from('character_relationships')
      .insert([
        {
          character_id: characterId,
          related_character_id: relatedCharacterId,
          relationship_type: relationshipType,
          created_at: new Date().toISOString()
        }
      ])
      .select();
  },

  // Delete a character relationship
  deleteRelationship: async (relationshipId) => {
    const client = await getClient();
    return client
      .from('character_relationships')
      .delete()
      .eq('id', relationshipId);
  }
};

// Settings/Locations Management
export const settings = {
  // Get all settings for a project
  getByProject: async (projectId) => {
    const client = await getClient();
    return client
      .from('settings')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
  },

  // Create a new setting
  create: async (projectId, name, type, description = '', keyFeatures = '') => {
    const client = await getClient();
    return client
      .from('settings')
      .insert([
        {
          project_id: projectId,
          name,
          type,
          description,
          key_features: keyFeatures,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
  },

  // Update a setting
  update: async (settingId, updates) => {
    const client = await getClient();
    return client
      .from('settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', settingId)
      .select();
  },

  // Delete a setting
  delete: async (settingId) => {
    const client = await getClient();
    return client
      .from('settings')
      .delete()
      .eq('id', settingId);
  }
};

// Timeline Events Management
export const timelineEvents = {
  // Get all timeline events for a project
  getByProject: async (projectId) => {
    const client = await getClient();
    return client
      .from('timeline_events')
      .select('*')
      .eq('project_id', projectId)
      .order('date_time', { ascending: true });
  },

  // Create a new timeline event
  create: async (projectId, name, dateTime = '', description = '', significance = '', location = '', location_id = null) => {
    const client = await getClient();
    const eventData = {
      project_id: projectId,
      name,
      date_time: dateTime,
      description,
      significance,
      location,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Only add location_id if it's provided and not null
    if (location_id) {
      eventData.location_id = location_id;
    }
    
    return client
      .from('timeline_events')
      .insert([eventData])
      .select();
  },

  // Update a timeline event
  update: async (eventId, updates) => {
    const client = await getClient();
    return client
      .from('timeline_events')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select();
  },

  // Delete a timeline event
  delete: async (eventId) => {
    const client = await getClient();
    return client
      .from('timeline_events')
      .delete()
      .eq('id', eventId);
  }
}; 
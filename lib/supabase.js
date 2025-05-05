// lib/supabase.js
// Get Supabase credentials from window.ENV
async function getSupabaseCredentials() {
  // First try to get from window.ENV (set by template processing)
  if (typeof window !== 'undefined' && window.ENV) {
    return {
      supabaseUrl: window.ENV.SUPABASE_URL,
      supabaseAnonKey: window.ENV.SUPABASE_ANON_KEY
    };
  }
  
  // Second, try to get from Netlify function (new method)
  if (typeof fetch !== 'undefined') {
    try {
      const response = await fetch('/get-env');
      if (response.ok) {
        const env = await response.json();
        if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
          return {
            supabaseUrl: env.SUPABASE_URL,
            supabaseAnonKey: env.SUPABASE_ANON_KEY
          };
        }
      }
    } catch (error) {
      console.warn('Failed to fetch environment variables from Netlify function:', error);
    }
  }
  
  // Fallback to meta tags (for compatibility)
  if (typeof document !== 'undefined') {
    const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
    const supabaseAnonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content;
    
    if (supabaseUrl && supabaseAnonKey) {
      return { supabaseUrl, supabaseAnonKey };
    }
  }
  
  // Fallback to hardcoded values (not recommended for production)
  console.warn('Using fallback Supabase credentials. This is not recommended for production.');
  return {
    supabaseUrl: 'https://tadqfmqlqlahoknivhds.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHFmbXFscWxhaG9rbml2aGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTY0MTAsImV4cCI6MjA2MTg5MjQxMH0.6afLHxoHlX3U3JzsqX6d61mpmiu3bICkbHgb1XDY7V0'
  };
}

// Create a global variable to hold the Supabase client
let supabase;

// Initialize the Supabase client
async function initSupabase() {
  if (!supabase) {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const { supabaseUrl, supabaseAnonKey } = await getSupabaseCredentials();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found');
      }
      
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      throw error;
    }
  }
  return supabase;
}

// Initialize immediately
(async () => {
  try {
    supabase = await initSupabase();
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
  }
})();

// Export the supabase client directly
export { supabase };

// Export auth functions
export const auth = {
  signUp: async (email, password) => {
    await initSupabase();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
  },

  signIn: async (email, password) => {
    await initSupabase();
    return supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signOut: async () => {
    await initSupabase();
    return supabase.auth.signOut();
  },

  getUser: async () => {
    await initSupabase();
    return supabase.auth.getUser();
  },

  getSession: async () => {
    await initSupabase();
    return supabase.auth.getSession();
  },

  onAuthStateChange: async (callback) => {
    await initSupabase();
    return supabase.auth.onAuthStateChange(callback);
  }
}; 

// Project Management
export const projects = {
  // Get all projects for the current user
  getAll: async () => {
    await initSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('User not authenticated') };

    return supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  },

  // Get a single project by ID
  getById: async (projectId) => {
    await initSupabase();
    return supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
  },

  // Create a new project
  create: async (title, description = '') => {
    await initSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('User not authenticated') };

    return supabase
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
    await initSupabase();
    return supabase
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
    await initSupabase();
    return supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
  }
};

// Chapter Management
export const chapters = {
  // Get all chapters for a project
  getByProject: async (projectId) => {
    await initSupabase();
    return supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
  },

  // Get a single chapter by ID
  getById: async (chapterId) => {
    await initSupabase();
    return supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
  },

  // Create a new chapter
  create: async (projectId, title, content = '', orderIndex = 0) => {
    await initSupabase();
    return supabase
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
    await initSupabase();
    return supabase
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
    await initSupabase();
    const updates = chapters.map(chapter => ({
      id: chapter.id,
      order_index: chapter.order_index,
      updated_at: new Date().toISOString()
    }));

    return supabase
      .from('chapters')
      .upsert(updates, { onConflict: 'id' });
  },

  // Delete a chapter
  delete: async (chapterId) => {
    await initSupabase();
    return supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);
  }
};

// Character Management
export const characters = {
  // Get all characters for a project
  getByProject: async (projectId) => {
    await initSupabase();
    return supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
  },

  // Get a single character by ID
  getById: async (characterId) => {
    await initSupabase();
    return supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();
  },

  // Create a new character
  create: async (projectId, name, role, traits = '', backstory = '') => {
    await initSupabase();
    return supabase
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
    await initSupabase();
    return supabase
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
    await initSupabase();
    return supabase
      .from('characters')
      .delete()
      .eq('id', characterId);
  },

  // Get character relationships
  getRelationships: async (characterId) => {
    await initSupabase();
    return supabase
      .from('character_relationships')
      .select('*, related_character_id(id, name, role)')
      .eq('character_id', characterId);
  },

  // Create a character relationship
  createRelationship: async (characterId, relatedCharacterId, relationshipType) => {
    await initSupabase();
    return supabase
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
    await initSupabase();
    return supabase
      .from('character_relationships')
      .delete()
      .eq('id', relationshipId);
  }
};

// Settings/Locations Management
export const settings = {
  // Get all settings for a project
  getByProject: async (projectId) => {
    await initSupabase();
    return supabase
      .from('settings')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
  },

  // Create a new setting
  create: async (projectId, name, type, description = '', keyFeatures = '') => {
    await initSupabase();
    return supabase
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
    await initSupabase();
    return supabase
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
    await initSupabase();
    return supabase
      .from('settings')
      .delete()
      .eq('id', settingId);
  }
};

// Timeline Events Management
export const timelineEvents = {
  // Get all timeline events for a project
  getByProject: async (projectId) => {
    await initSupabase();
    return supabase
      .from('timeline_events')
      .select('*')
      .eq('project_id', projectId)
      .order('date_time', { ascending: true });
  },

  // Create a new timeline event
  create: async (projectId, name, dateTime = '', description = '', significance = '', location = '', location_id = null) => {
    await initSupabase();
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
    
    return supabase
      .from('timeline_events')
      .insert([eventData])
      .select();
  },

  // Update a timeline event
  update: async (eventId, updates) => {
    await initSupabase();
    return supabase
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
    await initSupabase();
    return supabase
      .from('timeline_events')
      .delete()
      .eq('id', eventId);
  }
}; 
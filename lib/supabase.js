// lib/supabase.js
// Get Supabase credentials from window.ENV
function getSupabaseCredentials() {
  // First try to get from window.ENV (set by template processing)
  if (typeof window !== 'undefined' && window.ENV) {
    return {
      supabaseUrl: window.ENV.SUPABASE_URL,
      supabaseAnonKey: window.ENV.SUPABASE_ANON_KEY
    };
  }
  
  // Fallback to meta tags (for compatibility)
  if (typeof document !== 'undefined') {
    const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
    const supabaseAnonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content;
    
    if (supabaseUrl && supabaseAnonKey) {
      // Ensure URL is properly formatted with https:// prefix
      const formattedUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
      return { supabaseUrl: formattedUrl, supabaseAnonKey };
    }
  }
  
  // Check if we're in a development environment
  const isDev = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1');
  
  // Fallback to hardcoded values only in development (not recommended for production)
  if (isDev) {
    console.warn('Using fallback Supabase credentials. This is not recommended for production.');
    return {
      supabaseUrl: 'https://tadqfmqlqlahoknivhds.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHFmbXFscWxhaG9rbml2aGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTY0MTAsImV4cCI6MjA2MTg5MjQxMH0.6afLHxoHlX3U3JzsqX6d61mpmiu3bICkbHgb1XDY7V0'
    };
  }
  
  // If we can't get credentials, log an informative error
  console.error('Supabase credentials not found. Make sure environment variables are set or meta tags are included.');
  return { supabaseUrl: null, supabaseAnonKey: null };
}

// Create a global variable to hold the Supabase client
let supabase;

// Initialize the Supabase client
async function initSupabase() {
  if (!supabase) {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found. Check your environment variables or meta tags.');
      }
      
      // Additional validation to ensure URL is properly formatted
      try {
        new URL(supabaseUrl); // This will throw if URL is invalid
        supabase = createClient(supabaseUrl, supabaseAnonKey);
      } catch (urlError) {
        throw new Error(`Invalid Supabase URL: ${supabaseUrl}. Error: ${urlError.message}`);
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      
      // Return a mock client with noop methods if we can't initialize
      // This prevents errors when methods are called on an undefined supabase client
      return createMockClient();
    }
  }
  return supabase;
}

// Create a mock client to prevent errors when supabase initialization fails
function createMockClient() {
  const noopFunction = async () => ({ data: null, error: new Error('Supabase client not initialized') });
  
  return {
    auth: {
      getUser: noopFunction,
      getSession: noopFunction,
      signUp: noopFunction,
      signInWithPassword: noopFunction,
      signOut: noopFunction,
      onAuthStateChange: noopFunction
    },
    from: () => ({
      select: () => ({
        eq: noopFunction,
        order: () => ({
          eq: noopFunction,
          single: noopFunction
        }),
        single: noopFunction
      }),
      insert: noopFunction,
      update: () => ({
        eq: noopFunction,
        select: () => ({
          eq: noopFunction
        })
      }),
      delete: () => ({
        eq: noopFunction
      })
    })
  };
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
    try {
      // Instead of a bulk upsert operation, update each chapter individually
      const updatePromises = chapters.map(chapter => {
        return supabase
          .from('chapters')
          .update({
            order_index: chapter.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', chapter.id);
      });
      
      // Wait for all update operations to complete
      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        return { error: errors[0].error }; // Return the first error
      }
      
      return { data: chapters, error: null };
    } catch (error) {
      console.error("Error updating chapter order:", error);
      return { error };
    }
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
  create: async (projectId, name, dateTime = '', description = '', significance = '') => {
    await initSupabase();
    return supabase
      .from('timeline_events')
      .insert([
        {
          project_id: projectId,
          name,
          date_time: dateTime,
          description,
          significance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
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
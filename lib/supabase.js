// lib/supabase.js
// Get Supabase credentials from window.ENV
function getSupabaseCredentials() {
  // First try to get from window.ENV (set by template processing)
  if (typeof window !== 'undefined' && window.ENV) {
    const url = window.ENV.SUPABASE_URL;
    const key = window.ENV.SUPABASE_ANON_KEY;
    
    if (url && key) {
      // Ensure URL is properly formatted
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      return { supabaseUrl: formattedUrl, supabaseAnonKey: key };
    }
  }
  
  // Fallback to meta tags
  if (typeof document !== 'undefined') {
    const url = document.querySelector('meta[name="supabase-url"]')?.content;
    const key = document.querySelector('meta[name="supabase-anon-key"]')?.content;
    
    if (url && key) {
      // Ensure URL is properly formatted
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      return { supabaseUrl: formattedUrl, supabaseAnonKey: key };
    }
  }
  
  // For development environments, use a fallback value to prevent crashes
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1')) {
    console.warn('Using development fallback for Supabase credentials');
    return {
      supabaseUrl: 'https://tadqfmqlqlahoknivhds.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHFmbXFscWxhaG9rbml2aGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTY0MTAsImV4cCI6MjA2MTg5MjQxMH0.6afLHxoHlX3U3JzsqX6d61mpmiu3bICkbHgb1XDY7V0'
    };
  }
  
  console.warn('Supabase credentials not found. Please ensure environment variables are set.');
  return { supabaseUrl: '', supabaseAnonKey: '' };
}

// Create a global variable to hold the Supabase client
let supabase = null;

// Initialize the Supabase client
async function initSupabase() {
  if (!supabase) {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found');
      }
      
      // Validate URL before creating client
      try {
        new URL(supabaseUrl);
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Test the connection with minimal credentials check
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase session retrieval error:', error.message);
        }
      } catch (urlError) {
        console.error(`Invalid Supabase URL: ${supabaseUrl}`);
        throw new Error(`Invalid Supabase URL: ${urlError.message}`);
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      
      // Create and return a mock client
      return createMockClient();
    }
  }
  
  return supabase;
}

// Create a mock client for error cases
function createMockClient() {
  console.warn("Using mock Supabase client");
  
  const mockResponse = { data: null, error: new Error('Supabase client not initialized') };
  
  // Create a function that returns the mock response
  const noopFunction = async () => mockResponse;
  
  // Create a mock auth object
  const mockAuth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: noopFunction,
    signUp: noopFunction,
    signInWithPassword: noopFunction,
    signOut: noopFunction
  };
  
  // Return a mock client object
  return {
    auth: mockAuth,
    from: () => ({
      select: () => ({
        eq: noopFunction,
        order: () => ({
          eq: noopFunction
        })
      }),
      insert: noopFunction,
      update: () => ({
        eq: noopFunction
      }),
      delete: () => ({
        eq: noopFunction
      })
    })
  };
}

// Export auth functions
export const auth = {
  signUp: async (email, password) => {
    try {
      const client = await initSupabase();
      return client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
    } catch (error) {
      console.error("Auth signup error:", error);
      return { data: null, error };
    }
  },

  signIn: async (email, password) => {
    try {
      const client = await initSupabase();
      return client.auth.signInWithPassword({
        email,
        password
      });
    } catch (error) {
      console.error("Auth signin error:", error);
      return { data: null, error };
    }
  },

  signOut: async () => {
    try {
      const client = await initSupabase();
      return client.auth.signOut();
    } catch (error) {
      console.error("Auth signout error:", error);
      return { error };
    }
  },

  getUser: async () => {
    try {
      const client = await initSupabase();
      return client.auth.getUser();
    } catch (error) {
      console.error("Auth getUser error:", error);
      return { data: { user: null }, error };
    }
  },

  getSession: async () => {
    try {
      const client = await initSupabase();
      return client.auth.getSession();
    } catch (error) {
      console.error("Auth getSession error:", error);
      return { data: { session: null }, error };
    }
  }
};

// Export database functions
export const db = {
  from: async (table) => {
    const client = await initSupabase();
    return client.from(table);
  }
};

// Project Management
export const projects = {
  // Get all projects for the current user
  getAll: async () => {
    try {
      const client = await initSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return { data: null, error: new Error('User not authenticated') };

      return client
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    } catch (error) {
      console.error("Get all projects error:", error);
      return { data: null, error };
    }
  },

  // Get a single project by ID
  getById: async (projectId) => {
    try {
      const client = await initSupabase();
      return client
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
    } catch (error) {
      console.error("Get project by ID error:", error);
      return { data: null, error };
    }
  },

  // Create a new project
  create: async (title, description = '') => {
    try {
      const client = await initSupabase();
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
    } catch (error) {
      console.error("Create project error:", error);
      return { data: null, error };
    }
  },

  // Update a project
  update: async (projectId, updates) => {
    try {
      const client = await initSupabase();
      return client
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select();
    } catch (error) {
      console.error("Update project error:", error);
      return { data: null, error };
    }
  },

  // Delete a project
  delete: async (projectId) => {
    try {
      const client = await initSupabase();
      return client
        .from('projects')
        .delete()
        .eq('id', projectId);
    } catch (error) {
      console.error("Delete project error:", error);
      return { data: null, error };
    }
  }
};

// Chapter Management
export const chapters = {
  // Get all chapters for a project
  getByProject: async (projectId) => {
    try {
      const client = await initSupabase();
      return client
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });
    } catch (error) {
      console.error("Get chapters by project error:", error);
      return { data: null, error };
    }
  },

  // Get a single chapter by ID
  getById: async (chapterId) => {
    try {
      const client = await initSupabase();
      return client
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
    } catch (error) {
      console.error("Get chapter by ID error:", error);
      return { data: null, error };
    }
  },

  // Create a new chapter
  create: async (projectId, title, content = '', orderIndex = 0) => {
    try {
      const client = await initSupabase();
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
    } catch (error) {
      console.error("Create chapter error:", error);
      return { data: null, error };
    }
  },

  // Update a chapter
  update: async (chapterId, updates) => {
    try {
      const client = await initSupabase();
      return client
        .from('chapters')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId)
        .select();
    } catch (error) {
      console.error("Update chapter error:", error);
      return { data: null, error };
    }
  },

  // Update the order of chapters
  updateOrder: async (chapters) => {
    const client = await initSupabase();
    try {
      // Instead of a bulk upsert operation, update each chapter individually
      const updatePromises = chapters.map(chapter => {
        return client
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
    const client = await initSupabase();
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
    const client = await initSupabase();
    return client
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
  },

  // Get a single character by ID
  getById: async (characterId) => {
    const client = await initSupabase();
    return client
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();
  },

  // Create a new character
  create: async (projectId, name, role, traits = '', backstory = '') => {
    const client = await initSupabase();
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
    const client = await initSupabase();
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
    const client = await initSupabase();
    return client
      .from('characters')
      .delete()
      .eq('id', characterId);
  },

  // Get character relationships
  getRelationships: async (characterId) => {
    const client = await initSupabase();
    return client
      .from('character_relationships')
      .select('*, related_character_id(id, name, role)')
      .eq('character_id', characterId);
  },

  // Create a character relationship
  createRelationship: async (characterId, relatedCharacterId, relationshipType) => {
    const client = await initSupabase();
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
    const client = await initSupabase();
    return client
      .from('character_relationships')
      .delete()
      .eq('id', relationshipId);
  }
};

// Timeline Events Management
export const timelineEvents = {
  // Get all timeline events for a project with related data
  getByProject: async (projectId) => {
    const client = await initSupabase();
    return client
      .from('timeline_events')
      .select(`
        id,
        name,
        date_time,
        description,
        location_id,
        locations (id, name),
        timeline_event_characters (
          character_id,
          characters (id, name, role)
        )
      `)
      .eq('project_id', projectId)
      .order('date_time', { ascending: true });
  },

  // Create a new timeline event with character links
  create: async (projectId, name, dateTime, description, locationId, characterIds) => {
    const client = await initSupabase();
    try {
      // First create the event
      const { data: event, error: eventError } = await client
        .from('timeline_events')
        .insert([{
          project_id: projectId,
          name,
          date_time: dateTime,
          description,
          location_id: locationId
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // Then create character links if there are any characters
      if (characterIds && characterIds.length > 0) {
        const characterLinks = characterIds.map(characterId => ({
          event_id: event.id,
          character_id: characterId
        }));

        const { error: linkError } = await client
          .from('timeline_event_characters')
          .insert(characterLinks);

        if (linkError) throw linkError;
      }

      return { data: event, error: null };
    } catch (error) {
      console.error('Error creating timeline event:', error);
      return { data: null, error };
    }
  },

  // Update a timeline event
  update: async (eventId, updates) => {
    const client = await initSupabase();
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
    const client = await initSupabase();
    return client
      .from('timeline_events')
      .delete()
      .eq('id', eventId);
  },

  // Update event characters
  updateCharacters: async (eventId, characterIds) => {
    const client = await initSupabase();
    try {
      // First delete existing character links
      const { error: deleteError } = await client
        .from('timeline_event_characters')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) throw deleteError;

      // Then create new character links
      if (characterIds && characterIds.length > 0) {
        const characterLinks = characterIds.map(characterId => ({
          event_id: eventId,
          character_id: characterId
        }));

        const { error: insertError } = await client
          .from('timeline_event_characters')
          .insert(characterLinks);

        if (insertError) throw insertError;
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating event characters:', error);
      return { error };
    }
  }
};

// Locations Management (renamed from settings)
export const locations = {
  // Get all locations for a project
  getByProject: async (projectId) => {
    const client = await initSupabase();
    return client
      .from('locations')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
  },

  // Create a new location
  create: async (projectId, name, type, description = '', keyFeatures = '') => {
    const client = await initSupabase();
    return client
      .from('locations')
      .insert([{
        project_id: projectId,
        name,
        type,
        description,
        key_features: keyFeatures,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
  },

  // Update a location
  update: async (locationId, updates) => {
    const client = await initSupabase();
    return client
      .from('locations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)
      .select();
  },

  // Delete a location
  delete: async (locationId) => {
    const client = await initSupabase();
    return client
      .from('locations')
      .delete()
      .eq('id', locationId);
  }
}; 
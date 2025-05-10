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
      console.log('Using Supabase credentials from window.ENV');
      return { supabaseUrl: formattedUrl, supabaseAnonKey: key };
    }
  }
  
  // Fallback to meta tags (for compatibility)
  if (typeof document !== 'undefined') {
    let url = document.querySelector('meta[name="supabase-url"]')?.content;
    let key = document.querySelector('meta[name="supabase-anon-key"]')?.content;
    
    if (url && key) {
      // Remove template variables if they exist
      url = url.replace(/<%=\s*process\.env\.SUPABASE_URL\s*%>/, '').trim();
      key = key.replace(/<%=\s*process\.env\.SUPABASE_ANON_KEY\s*%>/, '').trim();
      
      if (url && key && url !== 'undefined' && key !== 'undefined') {
        // Ensure URL is properly formatted
        url = url.startsWith('http') ? url : `https://${url}`;
        console.log('Using Supabase credentials from meta tags');
        return { supabaseUrl: url, supabaseAnonKey: key };
      }
    }
  }
  
  // Check if we're in a development environment
  const isDev = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1');
  
  // Fallback to hardcoded values only in development
  if (isDev) {
    console.warn('Using fallback Supabase credentials. This is not recommended for production.');
    return {
      supabaseUrl: 'https://tadqfmqlqlahoknivhds.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHFmbXFscWxhaG9rbml2aGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTY0MTAsImV4cCI6MjA2MTg5MjQxMH0.6afLHxoHlX3U3JzsqX6d61mpmiu3bICkbHgb1XDY7V0'
    };
  }
  
  // Log the current state for debugging
  console.error('Supabase credentials not found. Current state:', {
    hasWindow: typeof window !== 'undefined',
    hasDocument: typeof document !== 'undefined',
    windowENV: typeof window !== 'undefined' ? window.ENV : undefined,
    metaTags: typeof document !== 'undefined' ? {
      url: document.querySelector('meta[name="supabase-url"]')?.content,
      key: document.querySelector('meta[name="supabase-anon-key"]')?.content
    } : undefined
  });
  
  throw new Error('Supabase credentials not found. Make sure environment variables SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file or deployment environment.');
}

// Create a global variable to hold the Supabase client
let supabase;

// Load Supabase client script
async function loadSupabaseScript() {
  try {
    // First try to load from unpkg
    try {
      const { createClient } = await import('https://unpkg.com/@supabase/supabase-js@2.39.3/dist/module/index.js');
      return createClient;
    } catch (unpkgError) {
      console.warn('Failed to load Supabase from unpkg, trying jsDelivr:', unpkgError);
      
      // Fallback to jsDelivr
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/module/index.js');
      return createClient;
    }
  } catch (error) {
    console.error('Failed to load Supabase client from CDN:', error);
    throw new Error('Could not load Supabase client. Please check your internet connection.');
  }
}

// Initialize the Supabase client
async function initSupabase() {
  if (!supabase) {
    try {
      const createClient = await loadSupabaseScript();
      const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found');
      }
      
      // Additional validation to ensure URL is properly formatted
      try {
        new URL(supabaseUrl); // This will throw if URL is invalid
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        
        // Test the connection
        const { error: testError } = await supabase.auth.getSession();
        if (testError) {
          throw testError;
        }
        
        console.log('Supabase client initialized successfully');
      } catch (urlError) {
        throw new Error(`Invalid Supabase URL: ${supabaseUrl}. Error: ${urlError.message}`);
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      return createMockClient();
    }
  }
  return supabase;
}

// Initialize immediately and export the promise
const initPromise = initSupabase();

// Export the supabase client getter
export async function getClient() {
  return initPromise;
}

// Create a mock client to prevent errors when supabase initialization fails
function createMockClient() {
  const noopFunction = async () => ({ data: null, error: new Error('Supabase client not initialized') });
  const mockAuth = {
    getUser: async () => ({ data: { user: null }, error: new Error('Supabase client not initialized') }),
    getSession: noopFunction,
    signUp: noopFunction,
    signInWithPassword: noopFunction,
    signOut: noopFunction,
    onAuthStateChange: noopFunction
  };
  
  return {
    auth: mockAuth,
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

// Export auth functions
export const auth = {
  signUp: async (email, password) => {
    const client = await initPromise;
    return client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
  },

  signIn: async (email, password) => {
    const client = await initPromise;
    return client.auth.signInWithPassword({
      email,
      password
    });
  },

  signOut: async () => {
    const client = await initPromise;
    return client.auth.signOut();
  },

  getUser: async () => {
    const client = await initPromise;
    return client.auth.getUser();
  },

  getSession: async () => {
    const client = await initPromise;
    return client.auth.getSession();
  },

  onAuthStateChange: async (callback) => {
    const client = await initPromise;
    return client.auth.onAuthStateChange(callback);
  }
};

// Project Management
export const projects = {
  // Get all projects for the current user
  getAll: async () => {
    const client = await initPromise;
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
    const client = await initPromise;
    return client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
  },

  // Create a new project
  create: async (title, description = '') => {
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
    return client
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
  },

  // Get a single chapter by ID
  getById: async (chapterId) => {
    const client = await initPromise;
    return client
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
  },

  // Create a new chapter
  create: async (projectId, title, content = '', orderIndex = 0) => {
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
    return client
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
  },

  // Get a single character by ID
  getById: async (characterId) => {
    const client = await initPromise;
    return client
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();
  },

  // Create a new character
  create: async (projectId, name, role, traits = '', backstory = '') => {
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
    return client
      .from('characters')
      .delete()
      .eq('id', characterId);
  },

  // Get character relationships
  getRelationships: async (characterId) => {
    const client = await initPromise;
    return client
      .from('character_relationships')
      .select('*, related_character_id(id, name, role)')
      .eq('character_id', characterId);
  },

  // Create a character relationship
  createRelationship: async (characterId, relatedCharacterId, relationshipType) => {
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
    return client
      .from('timeline_events')
      .delete()
      .eq('id', eventId);
  },

  // Update event characters
  updateCharacters: async (eventId, characterIds) => {
    const client = await initPromise;
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
    const client = await initPromise;
    return client
      .from('locations')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
  },

  // Create a new location
  create: async (projectId, name, type, description = '', keyFeatures = '') => {
    const client = await initPromise;
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
    const client = await initPromise;
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
    const client = await initPromise;
    return client
      .from('locations')
      .delete()
      .eq('id', locationId);
  }
}; 
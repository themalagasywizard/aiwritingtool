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

// Create a mock client suitable for development/fallback
function createMockClient() {
  console.warn('Creating mock Supabase client for fallback functionality');
  
  // For development, create a simple mock client that can be used
  // when the actual Supabase client fails to initialize
  const mockStorageKey = 'mock_auth_state';
  let mockAuthState = localStorage.getItem(mockStorageKey);
  
  try {
    mockAuthState = mockAuthState ? JSON.parse(mockAuthState) : null;
  } catch (e) {
    mockAuthState = null;
    localStorage.removeItem(mockStorageKey);
  }
  
  // Try to get user from supabase_auth_token if available
  let supabaseAuthToken = null;
  try {
    const tokenJson = localStorage.getItem('supabase_auth_token');
    if (tokenJson) {
      supabaseAuthToken = JSON.parse(tokenJson);
    }
  } catch (e) {
    console.warn('Error parsing supabase_auth_token', e);
  }
  
  // Prioritize supabase_auth_token over mock_auth_state
  const authUser = supabaseAuthToken?.user || mockAuthState || {
    email: localStorage.getItem('userEmail') || 'guest@example.com',
    id: 'mock_' + Math.random().toString(36).substring(2, 15)
  };
  
  return {
    auth: {
      getUser: async () => {
        console.log('[Mock] Getting user');
        return { 
          data: { 
            user: authUser
          },
          error: null
        };
      },
      
      getSession: async () => {
        console.log('[Mock] Getting session');
        return { 
          data: { 
            session: authUser ? { user: authUser } : null 
          },
          error: null
        };
      },
      
      signUp: async ({ email, password }) => {
        console.log(`[Mock] Sign up with ${email}`);
        // Generate a mock user ID
        const userId = 'mock_' + Math.random().toString(36).substring(2, 15);
        mockAuthState = { email, id: userId };
        localStorage.setItem(mockStorageKey, JSON.stringify(mockAuthState));
        localStorage.setItem('isAuthenticated', 'true');
        return { data: { user: { email, id: userId } }, error: null };
      },
      
      signInWithPassword: async ({ email, password }) => {
        console.log(`[Mock] Sign in with ${email}`);
        // For mock, just create a new user regardless
        const userId = authUser?.id || 'mock_' + Math.random().toString(36).substring(2, 15);
        mockAuthState = { email, id: userId };
        localStorage.setItem(mockStorageKey, JSON.stringify(mockAuthState));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        return { data: { user: { email, id: userId } }, error: null };
      },
      
      signOut: async () => {
        console.log('[Mock] Sign out');
        mockAuthState = null;
        localStorage.removeItem(mockStorageKey);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        return { error: null };
      }
    },
    
    from: (table) => {
      console.log(`[Mock] Creating query builder for table: ${table}`);
      return {
        select: (columns = '*') => {
          console.log(`[Mock] Select ${columns} from ${table}`);
          
          // Create a chainable query builder with all required methods
          const queryBuilder = {
            // Track the query state
            _query: {
              table,
              columns,
              filters: [],
              orderBy: null,
              limitVal: null,
              isSingle: false
            },
            
            // Filter by equality
            eq: function(column, value) {
              console.log(`[Mock] Adding filter ${column} = ${value}`);
              this._query.filters.push({ column, operator: 'eq', value });
              return this;
            },
            
            // Order results
            order: function(column, { ascending = true } = {}) {
              console.log(`[Mock] Adding order by ${column} ${ascending ? 'ASC' : 'DESC'}`);
              this._query.orderBy = { column, ascending };
              return this;
            },
            
            // Limit results
            limit: function(limit) {
              console.log(`[Mock] Setting limit to ${limit}`);
              this._query.limitVal = limit;
              return this;
            },
            
            // Return a single result
            single: function() {
              console.log(`[Mock] Setting to return single result`);
              this._query.isSingle = true;
              return this;
            },
            
            // Execute the query and return mock data
            then: function(resolve) {
              console.log(`[Mock] Executing query:`, this._query);
              
              // Generate mock data
              let mockData = generateMockData(this._query.table, this._query);
              
              // Apply filters
              this._query.filters.forEach(filter => {
                if (filter.operator === 'eq') {
                  mockData = mockData.filter(item => item[filter.column] === filter.value);
                }
              });
              
              // Apply ordering
              if (this._query.orderBy) {
                const { column, ascending } = this._query.orderBy;
                mockData.sort((a, b) => {
                  if (a[column] < b[column]) return ascending ? -1 : 1;
                  if (a[column] > b[column]) return ascending ? 1 : -1;
                  return 0;
                });
              }
              
              // Apply limit
              if (this._query.limitVal !== null) {
                mockData = mockData.slice(0, this._query.limitVal);
              }
              
              // Return single or array based on query
              const result = this._query.isSingle ? 
                { data: mockData.length > 0 ? mockData[0] : null, error: null } :
                { data: mockData, error: null };
              
              // Resolve the promise with the results
              resolve(result);
            }
          };
          
          return queryBuilder;
        },
        
        insert: (data) => {
          console.log(`[Mock] Inserting into ${table}:`, data);
          const mockIds = data.map(() => 'mock_' + Math.random().toString(36).substring(2, 15));
          const result = data.map((item, i) => ({ ...item, id: mockIds[i] }));
          return Promise.resolve({ data: result, error: null });
        },
        
        update: (data) => {
          return {
            eq: (column, value) => {
              console.log(`[Mock] Updating ${table} where ${column} = ${value}:`, data);
              return Promise.resolve({ data: [{ ...data, id: value }], error: null });
            }
          };
        },
        
        delete: () => {
          return {
            eq: (column, value) => {
              console.log(`[Mock] Deleting from ${table} where ${column} = ${value}`);
              return Promise.resolve({ data: null, error: null });
            }
          };
        }
      };
    }
  };
}

// Fake data generator
function generateMockData(tableName, query) {
  console.log('Generating mock data for table:', tableName, 'with query:', query);
  
  // Get user ID from auth state (for consistent mock data)
  let userId = 'mock-user-id';
  try {
    const authToken = localStorage.getItem('supabase_auth_token');
    if (authToken) {
      const parsed = JSON.parse(authToken);
      userId = parsed.user?.id || userId;
    }
  } catch (e) {
    console.warn('Error getting user ID from auth token:', e);
  }
  
  // Generate a random ID
  const randomId = () => 'mock_' + Math.random().toString(36).substring(2, 15);
  
  // Mock data for different tables
  const mockData = {
    projects: Array(3).fill(0).map((_, i) => ({
      id: randomId(),
      title: `Mock Project ${i+1}`,
      description: 'This is a mock project for testing',
      user_id: userId,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      updated_at: new Date(Date.now() - i * 3600000).toISOString()
    })),
    chapters: Array(5).fill(0).map((_, i) => ({
      id: randomId(),
      project_id: query?.filters?.find(f => f.column === 'project_id')?.value || 'mock-project-id',
      title: `Chapter ${i+1}`,
      content: 'This is mock chapter content for testing.',
      order_index: i,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      updated_at: new Date(Date.now() - i * 3600000).toISOString()
    })),
    characters: Array(4).fill(0).map((_, i) => ({
      id: randomId(),
      project_id: query?.filters?.find(f => f.column === 'project_id')?.value || 'mock-project-id',
      name: `Character ${i+1}`,
      role: i === 0 ? 'Protagonist' : i === 1 ? 'Antagonist' : 'Supporting',
      traits: 'Some mock character traits',
      backstory: 'Mock character backstory',
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      updated_at: new Date(Date.now() - i * 3600000).toISOString()
    })),
    locations: Array(3).fill(0).map((_, i) => ({
      id: randomId(),
      project_id: query?.filters?.find(f => f.column === 'project_id')?.value || 'mock-project-id',
      name: `Location ${i+1}`,
      type: 'Place',
      description: 'Mock location description',
      key_features: 'Mock key features',
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      updated_at: new Date(Date.now() - i * 3600000).toISOString()
    })),
    timeline_events: []
  };
  
  // If the table doesn't exist in our mock data, return empty array
  if (!mockData[tableName]) {
    return [];
  }
  
  return [...mockData[tableName]];
}

// Retry function with exponential backoff
async function retry(fn, maxRetries = 3, delay = 500) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${i + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      // Only delay if we're going to retry again
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

// Initialize the Supabase client
async function initSupabase() {
  if (!supabase) {
    try {
      // Wait for Supabase to be loaded
      if (typeof window.supabase === 'undefined') {
        console.warn('Supabase client not loaded from script tag. Using mock client instead.');
        return createMockClient();
      }

      const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not found');
      }
      
      // Additional validation to ensure URL is properly formatted
      try {
        new URL(supabaseUrl); // This will throw if URL is invalid
        
        // Create client using the global supabase object
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'supabase_auth_token'
          },
          global: {
            fetch: window.fetch, // Use window.fetch explicitly
            headers: {
              'X-Client-Info': 'Kalligram Web App'
            }
          }
        });
        
        // Test the connection with retry
        await retry(async () => {
          const { error: testError } = await supabase.auth.getSession();
          if (testError) {
            throw testError;
          }
        });
        
        console.log('Supabase client initialized successfully');
      } catch (urlError) {
        console.error(`Error initializing Supabase client:`, urlError);
        
        // If in development mode, use mock client as fallback
        if (typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1')) {
          console.warn('Falling back to mock client for development');
          return createMockClient();
        }
        
        throw new Error(`Invalid Supabase URL or connection failed: ${urlError.message}`);
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error);
      
      // For development, create a mock client so the app can still function
      if (typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1')) {
        console.warn('Using mock client due to initialization error');
        return createMockClient();
      }
      
      throw error;
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
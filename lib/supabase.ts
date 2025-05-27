import { createClient } from '@supabase/supabase-js'
import type { 
  User, 
  Project, 
  Chapter, 
  Character, 
  CharacterRelationship, 
  Location, 
  TimelineEvent 
} from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug environment variables
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set')
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: process.env.NODE_ENV === 'development'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
})

// Auth service
export const auth = {
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password })
  },

  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password })
  },

  async signOut() {
    return await supabase.auth.signOut()
  },

  async getUser() {
    return await supabase.auth.getUser()
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Projects service
export const projects = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Chapters service
export const chapters = {
  async getByProjectId(projectId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Chapter | null> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>): Promise<Chapter> {
    const { data, error } = await supabase
      .from('chapters')
      .insert(chapter)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Chapter>): Promise<Chapter> {
    const { data, error } = await supabase
      .from('chapters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Characters service
export const characters = {
  async getByProjectId(projectId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select(`
        *,
        relationships:character_relationships!character_a_id(*)
      `)
      .eq('project_id', projectId)
    
    if (error) throw error
    return data || []
  },

  async create(character: Omit<Character, 'id' | 'created_at' | 'updated_at'>): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .insert(character)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Character>): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Locations service
export const locations = {
  async getByProjectId(projectId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('project_id', projectId)
    
    if (error) throw error
    return data || []
  },

  async create(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Location>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Timeline events service
export const timelineEvents = {
  async getByProjectId(projectId: string): Promise<TimelineEvent[]> {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async create(event: Omit<TimelineEvent, 'id' | 'created_at' | 'updated_at'>): Promise<TimelineEvent> {
    const { data, error } = await supabase
      .from('timeline_events')
      .insert(event)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<TimelineEvent>): Promise<TimelineEvent> {
    const { data, error } = await supabase
      .from('timeline_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
} 
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  profile_picture_url?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
  last_edited?: string
  word_count?: number
}

export interface Chapter {
  id: string
  title: string
  content: string
  project_id: string
  order_index: number
  created_at: string
  updated_at: string
  word_count?: number
}

export interface Character {
  id: string
  name: string
  description?: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  project_id: string
  created_at: string
  updated_at: string
  relationships?: CharacterRelationship[]
}

export interface CharacterRelationship {
  id: string
  character_a_id: string
  character_b_id: string
  relationship_type: string
  description?: string
  created_at: string
}

export interface Location {
  id: string
  name: string
  description?: string
  project_id: string
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  event_date?: string
  project_id: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface ContextItem {
  id: string
  name: string
  type: 'character' | 'location' | 'timeline_event'
  data: Character | Location | TimelineEvent
}

export interface AIMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export interface EditorState {
  currentProject: Project | null
  currentChapter: Chapter | null
  chapters: Chapter[]
  isDirty: boolean
  wordCount: number
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
}

export interface ThemeConfig {
  theme: 'light' | 'dark' | 'system'
} 
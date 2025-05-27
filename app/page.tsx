'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/lib/use-toast'
import { formatDate, countWords, debounce } from '@/lib/utils'
import { SupabaseDebug } from '@/components/SupabaseDebug'
import { 
  Plus, 
  BookOpen, 
  User as UserIcon, 
  Settings,
  Moon,
  Sun,
  Edit,
  Trash,
  Sparkles,
  ArrowRight,
  Feather,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Type,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react'
import { useTheme } from 'next-themes'
import type { User, Project, Chapter, Character, AIMessage } from '@/types'

// Authentication Component
const AuthComponent: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const { toast } = useToast()

  // Debug environment variables
  const debugInfo = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          })
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        toast({
          title: "Success",
          description: "Account created! Please check your email for verification.",
        })
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        toast({
          title: "Success",
          description: "Successfully signed in!",
        })
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            <Feather className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Kalligram</h1>
          <p className="text-muted-foreground mt-2">AI-powered writing companion</p>
        </div>

        {/* Debug Info */}
        {showDebug && (
          <>
            <SupabaseDebug />
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">Debug Info</CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Create your account to start writing' 
                : 'Sign in to continue writing'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {isSignUp && (
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>
            </form>
            
            <div className="mt-4 text-center space-y-2">
              <Button
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </Button>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs"
                >
                  {showDebug ? 'Hide' : 'Show'} Debug Info
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Theme Toggle Component
const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )
}

// Rich Text Editor Component
const RichTextEditor: React.FC<{
  value: string
  onChange: (value: string) => void
  placeholder?: string
}> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState('')

  // Convert HTML content to plain text for word counting
  const getPlainText = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  // Format text commands
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleContentChange()
  }

  // Handle paste to clean up formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    handleContentChange()
  }

  // Set initial content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  return (
    <div className="flex flex-col h-full">
      {/* Formatting Toolbar */}
      <div className="border-b bg-card px-4 py-2 flex items-center space-x-1 flex-wrap gap-1">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyLeft')}
            className="h-8 w-8 p-0"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyCenter')}
            className="h-8 w-8 p-0"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyRight')}
            className="h-8 w-8 p-0"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertUnorderedList')}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertOrderedList')}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('formatBlock', 'blockquote')}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <select
          className="text-sm bg-background border border-border rounded px-2 py-1"
          onChange={(e) => formatText('fontSize', e.target.value)}
          defaultValue="3"
        >
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Extra Large</option>
        </select>

        <select
          className="text-sm bg-background border border-border rounded px-2 py-1"
          onChange={(e) => formatText('fontName', e.target.value)}
          defaultValue="Arial"
        >
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Helvetica">Helvetica</option>
        </select>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onPaste={handlePaste}
          className="w-full h-full min-h-[400px] outline-none text-base leading-relaxed prose prose-slate dark:prose-invert max-w-none focus:outline-none"
          style={{
            fontFamily: 'Georgia, serif',
            lineHeight: '1.8',
            fontSize: '16px'
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
        {/* Placeholder when empty */}
        {(!value || value.trim() === '') && (
          <div 
            className="absolute top-6 left-6 text-muted-foreground pointer-events-none"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: '1.8'
            }}
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}

// Main App Component
const KalligramApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [chapterContent, setChapterContent] = useState('')
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('projects')
  const [isLoading, setIsLoading] = useState(true)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [showNewChapterForm, setShowNewChapterForm] = useState(false)
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false)
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)
  
  const { toast } = useToast()

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (chapterId: string, content: string) => {
      if (chapterId && content !== undefined) {
        await saveChapter(chapterId, content)
      }
    }, 1000),
    [] // Keep empty dependency array but fix saveChapter to get current user
  )

  useEffect(() => {
    // Test Supabase connection
    const testSupabaseConnection = async () => {
      try {
        console.log('Testing Supabase connection...')
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
        console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
        
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        if (error) {
          console.error('Supabase connection test failed:', error)
        } else {
          console.log('Supabase connection test successful')
        }
      } catch (error) {
        console.error('Supabase connection error:', error)
      }
    }
    
    testSupabaseConnection()
    checkAuth()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleUserSignIn(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProjects([])
        setCurrentProject(null)
        setChapters([])
        setCurrentChapter(null)
        setCharacters([])
        setChapterContent('')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUserSignIn = async (authUser: any) => {
    try {
      console.log('Handling user sign in for:', authUser.id)
      setIsLoading(true) // Ensure loading state is set
      
      // Check if profile exists using user_id field
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      console.log('Profile query result:', { profile, error })

      // If profile doesn't exist, create one
      if (error && error.code === 'PGRST116') {
        console.log('Creating new profile for user:', authUser.id)
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            user_id: authUser.id,
            first_name: authUser.user_metadata?.first_name || '',
            last_name: authUser.user_metadata?.last_name || '',
            bio: '',
            location: authUser.email || '',
            profile_picture_url: authUser.user_metadata?.avatar_url || null,
            preferences: {},
            subscription_plan: 'starter',
            subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          toast({
            title: "Error",
            description: "Failed to create user profile. Please try again.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        profile = newProfile
        console.log('Created new profile:', profile)
      } else if (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: "Error", 
          description: `Failed to load user profile: ${error.message}`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (profile) {
        // Convert profile to match User type (using user_id as id)
        const user: User = {
          id: profile.user_id,
          email: authUser.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          profile_picture_url: profile.profile_picture_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }
        console.log('Setting user:', user)
        setUser(user)
        console.log('User set successfully, setting loading to false')
      } else {
        console.error('No profile found and no error - this should not happen')
        toast({
          title: "Error",
          description: "Profile not found. Please try signing in again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error handling user sign in:', error)
      toast({
        title: "Error",
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log('Setting isLoading to false in finally block')
      setIsLoading(false)
    }
  }

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setIsLoading(false)
        return
      }
      
      console.log('Session check result:', { hasSession: !!session, hasUser: !!session?.user })
      
      if (session?.user) {
        console.log('User found in session, calling handleUserSignIn')
        await handleUserSignIn(session.user)
      } else {
        console.log('No user in session, setting loading to false')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  useEffect(() => {
    if (currentProject) {
      loadChapters(currentProject.id)
      loadCharacters(currentProject.id)
    }
  }, [currentProject])

  useEffect(() => {
    if (currentChapter && chapterContent !== currentChapter.content) {
      debouncedSave(currentChapter.id, chapterContent)
    }
  }, [chapterContent, currentChapter, debouncedSave])

  // Keyboard shortcuts for sidebar collapse
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '[':
            event.preventDefault()
            setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)
            break
          case ']':
            event.preventDefault()
            setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLeftSidebarCollapsed, isRightSidebarCollapsed])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProjects([])
      setCurrentProject(null)
      setChapters([])
      setCurrentChapter(null)
      setCharacters([])
      setChapterContent('')
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadProjects = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      })
    }
  }

  const createProject = async (title: string, description: string) => {
    if (!user || !title.trim()) return
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: title.trim(),
          description: description.trim() || null,
          user_id: user.id
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setProjects(prev => [data, ...prev])
      setNewProjectTitle('')
      setNewProjectDescription('')
      setShowNewProjectForm(false)
      
      toast({
        title: "Project created",
        description: `"${title}" has been created successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadChapters = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
      
      if (error) throw error
      setChapters(data || [])
      
      if (data && data.length > 0) {
        const cleanedContent = cleanupContent(data[0].content || '')
        setCurrentChapter(data[0])
        setChapterContent(cleanedContent)
      } else {
        setCurrentChapter(null)
        setChapterContent('')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chapters. Please try again.",
        variant: "destructive",
      })
    }
  }

  const createChapter = async (title: string) => {
    if (!currentProject || !title.trim()) return
    
    try {
      const maxOrder = Math.max(...chapters.map(c => c.order_index), 0)
      
      const { data, error } = await supabase
        .from('chapters')
        .insert([{
          title: title.trim(),
          content: '',
          project_id: currentProject.id,
          order_index: maxOrder + 1
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setChapters(prev => [...prev, data])
      setCurrentChapter(data)
      setChapterContent('')
      setNewChapterTitle('')
      setShowNewChapterForm(false)
      
      toast({
        title: "Chapter created",
        description: `"${title}" has been created successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chapter. Please try again.",
        variant: "destructive",
      })
    }
  }

  const saveChapter = async (chapterId: string, content: string) => {
    try {
      console.log('Attempting to save chapter:', chapterId)
      console.log('Content length:', content.length)
      
      // Get current user from Supabase auth session
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      
      console.log('Current auth user:', currentUser)
      console.log('User object from state:', user)
      console.log('User ID from state:', user?.id)
      console.log('Current chapter:', currentChapter)
      
      if (authError || !currentUser) {
        throw new Error('User not authenticated')
      }
      
      // First, verify the chapter exists and get its project info
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select(`
          id,
          project_id,
          projects!inner(user_id)
        `)
        .eq('id', chapterId)
        .single()
      
      if (chapterError) {
        console.error('Error fetching chapter:', chapterError)
        throw new Error(`Chapter not found: ${chapterError.message}`)
      }
      
      console.log('Chapter data:', chapterData)
      console.log('Chapter project user_id:', (chapterData as any).projects?.user_id)
      console.log('Current user ID:', currentUser.id)
      
      // Verify the chapter belongs to a project owned by the current user
      if ((chapterData as any).projects?.user_id !== currentUser.id) {
        throw new Error('You do not have permission to edit this chapter')
      }
      
      const wordCount = countWordsFromHTML(content)
      
      const { data, error } = await supabase
        .from('chapters')
        .update({
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId)
        .select()
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        throw error
      }
      
      console.log('Save successful:', data)
      
      // Update local state
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { ...chapter, content, word_count: wordCount }
          : chapter
      ))
      
      if (currentChapter?.id === chapterId) {
        setCurrentChapter(prev => prev ? { ...prev, content, word_count: wordCount } : null)
      }
      
      // Show success toast
      toast({
        title: "Chapter saved",
        description: "Your changes have been saved successfully.",
      })
    } catch (error: any) {
      console.error('Save chapter error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack,
        fullError: error
      })
      
      let errorMessage = 'Unknown error'
      if (error.message) {
        errorMessage = error.message
      }
      if (error.details) {
        errorMessage += ` (${error.details})`
      }
      if (error.hint) {
        errorMessage += ` Hint: ${error.hint}`
      }
      
      toast({
        title: "Error",
        description: `Failed to save chapter: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const loadCharacters = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setCharacters(data || [])
    } catch (error) {
      console.error('Failed to load characters:', error)
    }
  }

  const generateAIContent = async () => {
    if (!aiInput.trim() || isGenerating) return
    
    setIsGenerating(true)
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: aiInput,
      isUser: true,
      timestamp: new Date()
    }
    
    setAiMessages(prev => [...prev, userMessage])
    setAiInput('')
    
    try {
      // Simulate AI response (replace with actual AI API call)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: `Here's a creative response to: "${userMessage.content}"\n\nThis is a simulated AI response. In a real implementation, this would connect to an AI service like OpenAI's GPT API to generate contextual writing assistance based on your project, characters, and current chapter content.`,
        isUser: false,
        timestamp: new Date()
      }
      
      setAiMessages(prev => [...prev, aiResponse])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const insertAIContent = (content: string) => {
    // Simply append the AI content to the current chapter content
    setChapterContent(prev => prev + '\n\n' + content)
  }

  const handleContentChange = (content: string) => {
    setChapterContent(content)
  }

  // Helper function to count words from HTML content
  const countWordsFromHTML = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    const text = div.textContent || div.innerText || ''
    return countWords(text)
  }

  // Helper function to clean up malformed HTML content
  const cleanupContent = (content: string) => {
    if (!content) return ''
    
    // If content contains style attributes or CSS, extract just the text
    if (content.includes('style=') || content.includes('class=')) {
      const div = document.createElement('div')
      div.innerHTML = content
      return div.textContent || div.innerText || ''
    }
    
    return content
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Kalligram...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthComponent />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">Kalligram</h1>
            {currentProject && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-lg font-medium">{currentProject.title}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Avatar>
              <AvatarImage src={user.profile_picture_url} />
              <AvatarFallback>
                {user.first_name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className={`${isLeftSidebarCollapsed ? 'w-12' : 'w-80'} border-r bg-card transition-all duration-300 ease-in-out`}>
          {!isLeftSidebarCollapsed ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <div className="flex items-center justify-between p-2">
                <TabsList className="grid flex-1 grid-cols-3">
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="chapters">Chapters</TabsTrigger>
                  <TabsTrigger value="characters">Characters</TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLeftSidebarCollapsed(true)}
                  className="ml-2 h-8 w-8"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            
            <TabsContent value="projects" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Your Projects</h3>
                <Button
                  size="sm"
                  onClick={() => setShowNewProjectForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
              
              {showNewProjectForm && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Input
                      placeholder="Project title"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Project description (optional)"
                      value={newProjectDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProjectDescription(e.target.value)}
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => createProject(newProjectTitle, newProjectDescription)}
                        disabled={!newProjectTitle.trim()}
                      >
                        Create
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewProjectForm(false)
                          setNewProjectTitle('')
                          setNewProjectDescription('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-2">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className={`cursor-pointer transition-colors ${
                      currentProject?.id === project.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setCurrentProject(project)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-medium">{project.title}</h4>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {formatDate(project.updated_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="chapters" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Chapters</h3>
                {currentProject && (
                  <Button
                    size="sm"
                    onClick={() => setShowNewChapterForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                )}
              </div>
              
              {!currentProject ? (
                <p className="text-sm text-muted-foreground">
                  Select a project to view chapters
                </p>
              ) : (
                <>
                  {showNewChapterForm && (
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Input
                          placeholder="Chapter title"
                          value={newChapterTitle}
                          onChange={(e) => setNewChapterTitle(e.target.value)}
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => createChapter(newChapterTitle)}
                            disabled={!newChapterTitle.trim()}
                          >
                            Create
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowNewChapterForm(false)
                              setNewChapterTitle('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-2">
                    {chapters.map((chapter) => (
                      <Card
                        key={chapter.id}
                        className={`cursor-pointer transition-colors ${
                          currentChapter?.id === chapter.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => {
                          setCurrentChapter(chapter)
                          setChapterContent(cleanupContent(chapter.content || ''))
                        }}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium">{chapter.title}</h4>
                          <p className="text-xs text-muted-foreground mt-2">
                            {chapter.word_count || 0} words
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="characters" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Characters</h3>
                {currentProject && (
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                )}
              </div>
              
              {!currentProject ? (
                <p className="text-sm text-muted-foreground">
                  Select a project to view characters
                </p>
              ) : (
                <div className="space-y-2">
                  {characters.map((character) => (
                    <Card key={character.id}>
                      <CardContent className="p-4">
                        <h4 className="font-medium">{character.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">
                          {character.role}
                        </p>
                        {character.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {character.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {characters.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No characters yet. Create your first character!
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLeftSidebarCollapsed(false)}
                  className="w-8 h-8"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Editor */}
          <div className="flex-1 flex flex-col">
            {currentChapter ? (
              <>
                <div className="border-b bg-card px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{currentChapter.title}</h2>
                    <div className="text-sm text-muted-foreground">
                      {countWordsFromHTML(chapterContent)} words
                    </div>
                  </div>
                </div>
                
                <RichTextEditor
                  value={chapterContent}
                  onChange={handleContentChange}
                  placeholder="Start writing your story..."
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No chapter selected</h3>
                  <p className="text-muted-foreground">
                    {currentProject 
                      ? 'Select a chapter from the sidebar to start writing'
                      : 'Select a project and chapter to begin writing'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <div className={`${isRightSidebarCollapsed ? 'w-12' : 'w-80'} border-l bg-card flex flex-col transition-all duration-300 ease-in-out`}>
            {!isRightSidebarCollapsed ? (
              <>
                <div className="border-b px-4 py-4 flex items-center justify-between">
                  <h3 className="font-semibold flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    AI Assistant
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRightSidebarCollapsed(true)}
                    className="h-8 w-8"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {aiMessages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">
                    Ask me anything about your story, characters, or need help with writing!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.isUser
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {!message.isUser && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-6 px-2 text-xs"
                          onClick={() => insertAIContent(message.content)}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Insert
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask AI for help..."
                  onKeyPress={(e) => e.key === 'Enter' && generateAIContent()}
                  disabled={isGenerating}
                />
                <Button
                  onClick={generateAIContent}
                  disabled={!aiInput.trim() || isGenerating}
                  size="icon"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRightSidebarCollapsed(false)}
                    className="w-8 h-8"
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default KalligramApp 
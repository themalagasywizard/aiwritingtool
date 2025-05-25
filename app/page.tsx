'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/lib/use-toast'
import { formatDate, countWords, debounce } from '@/lib/utils'
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
  ArrowRight
} from 'lucide-react'
import { useTheme } from 'next-themes'
import type { User, Project, Chapter, Character, AIMessage } from '@/types'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  
  const { toast } = useToast()

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (chapterId: string, content: string) => {
      if (chapterId && content !== undefined) {
        await saveChapter(chapterId, content)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    checkAuth()
  }, [])

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

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          setUser(profile)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
        setCurrentChapter(data[0])
        setChapterContent(data[0].content || '')
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
      const wordCount = countWords(content)
      
      const { error } = await supabase
        .from('chapters')
        .update({
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId)
      
      if (error) throw error
      
      // Update local state
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { ...chapter, content, word_count: wordCount }
          : chapter
      ))
      
      if (currentChapter?.id === chapterId) {
        setCurrentChapter(prev => prev ? { ...prev, content, word_count: wordCount } : null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save chapter. Please try again.",
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChapterContent(e.target.value)
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to Kalligram</CardTitle>
            <CardDescription>
              An AI-powered writing tool for storytellers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please sign in to continue to your writing projects.
            </p>
            <Button className="w-full" onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
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
        {/* Sidebar */}
        <div className="w-80 border-r bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
            </TabsList>
            
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
                      onChange={(e) => setNewProjectDescription(e.target.value)}
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
                          setChapterContent(chapter.content || '')
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
                      {countWords(chapterContent)} words
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-6">
                  <Textarea
                    value={chapterContent}
                    onChange={handleContentChange}
                    placeholder="Start writing your story..."
                    className="w-full h-full resize-none border-none focus:ring-0 text-base leading-relaxed editor-content"
                  />
                </div>
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
          <div className="w-80 border-l bg-card flex flex-col">
            <div className="border-b px-4 py-4">
              <h3 className="font-semibold flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                AI Assistant
              </h3>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default KalligramApp 
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/use-toast'
import { Feather, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  profile_picture_url?: string
  created_at: string
  updated_at: string
}

// Simple Auth Component
const AuthForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) throw error
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            <Feather className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">Kalligram</h1>
          <p className="text-muted-foreground mt-2">AI-powered writing companion</p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Create your account to start writing' 
                : 'Welcome back to your writing workspace'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              
              {isSignUp && (
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Create one"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Simple App Component for authenticated users
const WritingApp: React.FC<{ user: User; onSignOut: () => void }> = ({ user, onSignOut }) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Feather className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Kalligram</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.first_name || user.email}
            </span>
            <Button variant="outline" onClick={onSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-4">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Welcome to Kalligram!</h2>
          <p className="text-muted-foreground mb-8">Your AI-powered writing workspace is ready.</p>
          <div className="bg-card p-8 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              Authentication successful! Your writing tools will be loaded here.
            </p>
          </div>
        </div>
      </main>
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

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed top-4 right-4"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </Button>
  )
}

// Main App Component
export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    // Check current session
    const checkSession = async () => {
      try {
        console.log('🔍 Checking current session...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session check failed:', error)
          return
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session')
          await loadUserProfile(session.user.id)
        } else {
          console.log('ℹ️ No existing session')
        }
      } catch (error) {
        console.error('💥 Session check crashed:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Load user profile from database
    const loadUserProfile = async (userId: string) => {
      try {
        console.log('👤 Loading user profile for:', userId)
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('➕ Creating new profile...')
          await createUserProfile(userId)
        } else if (error) {
          throw error
        } else if (profile && mounted) {
          console.log('✅ Profile loaded successfully')
          setUser({
            id: profile.user_id,
            email: profile.email || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            profile_picture_url: profile.profile_picture_url,
            created_at: profile.created_at,
            updated_at: profile.updated_at
          })
        }
      } catch (error: any) {
        console.error('❌ Failed to load profile:', error)
        toast({
          title: "Profile Error",
          description: "Failed to load your profile. Please try signing in again.",
          variant: "destructive",
        })
      }
    }

    // Create new user profile
    const createUserProfile = async (userId: string) => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) throw new Error('No authenticated user found')

        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert([{
            user_id: userId,
            email: authUser.email || '',
            first_name: authUser.user_metadata?.first_name || '',
            last_name: authUser.user_metadata?.last_name || '',
            bio: '',
            preferences: {},
            subscription_plan: 'starter',
            subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }])
          .select()
          .single()

        if (error) throw error

        if (newProfile && mounted) {
          console.log('✅ New profile created successfully')
          setUser({
            id: newProfile.user_id,
            email: newProfile.email || '',
            first_name: newProfile.first_name || '',
            last_name: newProfile.last_name || '',
            profile_picture_url: newProfile.profile_picture_url,
            created_at: newProfile.created_at,
            updated_at: newProfile.updated_at
          })
        }
      } catch (error: any) {
        console.error('❌ Failed to create profile:', error)
        toast({
          title: "Setup Error",
          description: "Failed to set up your profile. Please try again.",
          variant: "destructive",
        })
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session?.user && mounted) {
        await loadUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null)
        console.log('👋 User signed out')
      }
    })

    checkSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [toast])

  const handleSignOut = async () => {
    try {
      console.log('👋 Signing out...')
      await supabase.auth.signOut()
      setUser(null)
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error: any) {
      console.error('❌ Sign out failed:', error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Kalligram...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ThemeToggle />
      {user ? (
        <WritingApp user={user} onSignOut={handleSignOut} />
      ) : (
        <AuthForm />
      )}
    </>
  )
} 
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const SupabaseDebug: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [envStatus, setEnvStatus] = useState({
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    keyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
  })

  const testConnection = async () => {
    setConnectionStatus('testing')
    setErrorMessage('')
    
    try {
      console.log('Testing Supabase connection...')
      
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        throw error
      }
      
      console.log('Connection test successful:', data)
      setConnectionStatus('success')
    } catch (error: any) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
      setErrorMessage(error.message || 'Unknown error')
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Supabase Connection Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Environment Variables</h4>
          <div className="text-xs space-y-1">
            <div className={`flex items-center gap-2 ${envStatus.url ? 'text-green-600' : 'text-red-600'}`}>
              <span>{envStatus.url ? '✓' : '✗'}</span>
              <span>NEXT_PUBLIC_SUPABASE_URL: {envStatus.url ? envStatus.urlValue : 'Not set'}</span>
            </div>
            <div className={`flex items-center gap-2 ${envStatus.key ? 'text-green-600' : 'text-red-600'}`}>
              <span>{envStatus.key ? '✓' : '✗'}</span>
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envStatus.key ? envStatus.keyValue : 'Not set'}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Connection Status</h4>
          <div className="flex items-center gap-2">
            {connectionStatus === 'testing' && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span className="text-sm">Testing connection...</span>
              </>
            )}
            {connectionStatus === 'success' && (
              <>
                <span className="text-green-600">✓</span>
                <span className="text-sm text-green-600">Connection successful</span>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <span className="text-red-600">✗</span>
                <span className="text-sm text-red-600">Connection failed: {errorMessage}</span>
              </>
            )}
          </div>
        </div>
        
        <Button onClick={testConnection} size="sm" variant="outline">
          Test Connection Again
        </Button>
        
        {!envStatus.url || !envStatus.key ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-medium text-yellow-800">Environment Variables Missing</p>
            <p className="text-yellow-700 mt-1">
              Please set up your environment variables with the NEXT_PUBLIC_ prefix. 
              Check the NETLIFY_ENV_SETUP.md file for instructions.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
} 
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Handle magic link callback
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (accessToken) {
      localStorage.setItem('supabase_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('supabase_refresh_token', refreshToken)
      }
      router.push('/app')
    } else {
      // Check for hash fragment (Supabase sometimes uses this)
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const token = params.get('access_token')
        const refresh = params.get('refresh_token')
        
        if (token) {
          localStorage.setItem('supabase_token', token)
          if (refresh) {
            localStorage.setItem('supabase_refresh_token', refresh)
          }
          router.push('/app')
          return
        }
      }
      
      // No tokens found, redirect to auth
      router.push('/auth')
    }
  }, [router, searchParams])
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}

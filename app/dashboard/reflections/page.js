'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layers, ArrowLeft, Calendar, History, Loader2, LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { WeeklyReflectionView } from '@/components/reflection'

export default function ReflectionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [currentReflection, setCurrentReflection] = useState(null)
  const [reflectionHistory, setReflectionHistory] = useState([])
  const [isNewReflection, setIsNewReflection] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  
  useEffect(() => {
    checkAuthAndLoad()
  }, [])
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token')
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' }
  }
  
  const checkAuthAndLoad = async () => {
    const token = localStorage.getItem('supabase_token')
    
    if (!token) {
      toast.error('Please sign in to view reflections')
      router.push('/auth')
      return
    }
    
    try {
      const userRes = await fetch('/api/auth/user', { headers: getAuthHeaders() })
      const userData = await userRes.json()
      
      if (!userData.user) {
        localStorage.removeItem('supabase_token')
        router.push('/auth')
        return
      }
      
      setUser(userData.user)
      await loadReflections()
    } catch (error) {
      console.error('Failed to load:', error)
      toast.error('Failed to load reflections')
    } finally {
      setLoading(false)
    }
  }
  
  const loadReflections = async () => {
    try {
      // Load current/new reflection
      const currentRes = await fetch('/api/reflections/weekly', { headers: getAuthHeaders() })
      const currentData = await currentRes.json()
      
      setCurrentReflection(currentData.reflection)
      setIsNewReflection(currentData.isNew)
      
      // Load history
      const historyRes = await fetch('/api/reflections/history', { headers: getAuthHeaders() })
      const historyData = await historyRes.json()
      
      setReflectionHistory(historyData.reflections || [])
    } catch (error) {
      console.error('Failed to load reflections:', error)
    }
  }
  
  const handleSaveReflection = async (reflection) => {
    try {
      const res = await fetch('/api/reflections/weekly', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reflection)
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      const data = await res.json()
      setCurrentReflection(data.reflection)
      setIsNewReflection(false)
      
      // Reload history
      const historyRes = await fetch('/api/reflections/history', { headers: getAuthHeaders() })
      const historyData = await historyRes.json()
      setReflectionHistory(historyData.reflections || [])
      
      toast.success('Reflection saved')
    } catch (error) {
      toast.error('Failed to save reflection')
      throw error
    }
  }
  
  const handleSignOut = () => {
    localStorage.removeItem('supabase_token')
    localStorage.removeItem('supabase_refresh_token')
    toast.success('Signed out')
    router.push('/')
  }
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  const getSelectedReflection = () => {
    if (selectedHistoryId) {
      return reflectionHistory.find(r => r.id === selectedHistoryId)
    }
    return currentReflection
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">Context</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/dashboard/timeline">
                <Button variant="ghost" size="sm">Timeline</Button>
              </Link>
              <Link href="/dashboard/reflections">
                <Button variant="ghost" size="sm" className="text-foreground">Reflections</Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold">Reflections</h1>
            <p className="text-muted-foreground">Weekly summaries and insights</p>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - History */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 sticky top-24">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">History</span>
                </div>
                
                {/* Current Week */}
                <button
                  onClick={() => setSelectedHistoryId(null)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    !selectedHistoryId ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">This Week</span>
                  </div>
                  {isNewReflection && (
                    <span className="text-xs text-muted-foreground mt-1 block">New</span>
                  )}
                </button>
                
                {/* Past Reflections */}
                {reflectionHistory.length > 0 ? (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {reflectionHistory.map(reflection => (
                      <button
                        key={reflection.id}
                        onClick={() => setSelectedHistoryId(reflection.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedHistoryId === reflection.id 
                            ? 'bg-muted/50 border border-border' 
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <p className="text-sm">
                          {formatDate(reflection.period_start)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reflection.summary?.receipts_count || 0} receipts, {reflection.summary?.moments_count || 0} moments
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No past reflections yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <WeeklyReflectionView
              reflection={getSelectedReflection()}
              onSave={selectedHistoryId ? null : handleSaveReflection}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

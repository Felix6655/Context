'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Layers, ArrowLeft, Loader2, Download, LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [user, setUser] = useState(null)
  
  // Profile state
  const [fullName, setFullName] = useState('')
  const [perspectiveIntensity, setPerspectiveIntensity] = useState('medium')
  
  useEffect(() => {
    loadProfile()
  }, [])
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token')
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' }
  }
  
  const loadProfile = async () => {
    const token = localStorage.getItem('supabase_token')
    
    if (!token) {
      toast.error('Please sign in to access settings')
      router.push('/auth')
      return
    }
    
    try {
      // Get user
      const userRes = await fetch('/api/auth/user', { headers: getAuthHeaders() })
      const userData = await userRes.json()
      
      if (!userData.user) {
        localStorage.removeItem('supabase_token')
        router.push('/auth')
        return
      }
      
      setUser(userData.user)
      
      // Get profile
      const profileRes = await fetch('/api/profile', { headers: getAuthHeaders() })
      const profileData = await profileRes.json()
      
      if (profileData.profile) {
        setFullName(profileData.profile.full_name || '')
        setPerspectiveIntensity(profileData.profile.perspective_intensity || 'medium')
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: fullName.trim(),
          perspective_intensity: perspectiveIntensity
        })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update profile')
      }
      
      toast.success('Settings saved')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleExport = async () => {
    setExporting(true)
    
    try {
      const headers = getAuthHeaders()
      
      // Fetch all data
      const [receiptsRes, momentsRes] = await Promise.all([
        fetch('/api/receipts', { headers }),
        fetch('/api/moments', { headers })
      ])
      
      const [receiptsData, momentsData] = await Promise.all([
        receiptsRes.json(),
        momentsRes.json()
      ])
      
      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user?.email,
        receipts: receiptsData.receipts || [],
        moments: momentsData.moments || []
      }
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `context-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }
  
  const handleSignOut = () => {
    localStorage.removeItem('supabase_token')
    localStorage.removeItem('supabase_refresh_token')
    toast.success('Signed out')
    router.push('/')
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
              <Link href="/app">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/app/timeline">
                <Button variant="ghost" size="sm">Timeline</Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/app/settings">
              <Button variant="ghost" size="icon" className="text-foreground">
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
      
      <main className="container max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        
        {/* Profile Settings */}
        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Perspective Intensity</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Controls how often perspective prompts appear
              </p>
              <Select value={perspectiveIntensity} onValueChange={setPerspectiveIntensity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Fewer prompts</SelectItem>
                  <SelectItem value="medium">Medium - Balanced</SelectItem>
                  <SelectItem value="high">High - More prompts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Data Export */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Download all your data as JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all your receipts and moments as a JSON file. 
              This includes all your decision context, moments, and tags.
            </p>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export Data
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

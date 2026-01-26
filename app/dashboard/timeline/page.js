'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Layers, FileText, Clock, ArrowLeft, ChevronRight, Search, Filter, X, LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { demoReceipts, demoMoments } from '@/lib/demo-data'

const DECISION_TYPES = ['Career', 'Money', 'Relationship', 'Health', 'Project', 'Other']
const CATEGORIES = ['People', 'Place', 'Routine', 'Work', 'Family', 'Other']

export default function TimelinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [timeline, setTimeline] = useState([])
  const [user, setUser] = useState(null)
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [decisionTypeFilter, setDecisionTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  useEffect(() => {
    loadTimeline()
  }, [])
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
  
  const loadTimeline = async () => {
    const token = localStorage.getItem('supabase_token')
    
    if (!token) {
      // Demo mode
      const combined = [
        ...demoReceipts.map(r => ({ ...r, item_type: 'receipt' })),
        ...demoMoments.map(m => ({ ...m, item_type: 'moment' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      setTimeline(combined)
      setIsDemo(true)
      setLoading(false)
      return
    }
    
    try {
      // Check user
      const userRes = await fetch('/api/auth/user', { headers: getAuthHeaders() })
      const userData = await userRes.json()
      setUser(userData.user)
      
      const res = await fetch('/api/timeline', { headers: getAuthHeaders() })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setTimeline(data.timeline || [])
    } catch (error) {
      console.error('Failed to load timeline:', error)
      toast.error('Failed to load timeline')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignOut = () => {
    localStorage.removeItem('supabase_token')
    localStorage.removeItem('supabase_refresh_token')
    toast.success('Signed out')
    router.push('/')
  }
  
  // Apply filters
  const filteredTimeline = timeline.filter(item => {
    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'receipt' && item.item_type !== 'receipt') return false
      if (typeFilter === 'moment' && item.item_type !== 'moment') return false
    }
    
    // Category filter (moments only)
    if (categoryFilter !== 'all' && item.item_type === 'moment') {
      if (item.category !== categoryFilter) return false
    }
    
    // Decision type filter (receipts only)
    if (decisionTypeFilter !== 'all' && item.item_type === 'receipt') {
      if (item.decision_type !== decisionTypeFilter) return false
    }
    
    // Tag filter
    if (tagFilter.trim()) {
      const searchTag = tagFilter.toLowerCase().trim()
      const itemTags = (item.tags || []).map(t => t.toLowerCase())
      if (!itemTags.some(t => t.includes(searchTag))) return false
    }
    
    return true
  })
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  const clearFilters = () => {
    setTypeFilter('all')
    setCategoryFilter('all')
    setDecisionTypeFilter('all')
    setTagFilter('')
  }
  
  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || decisionTypeFilter !== 'all' || tagFilter.trim()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
                <Button variant="ghost" size="sm" className="text-foreground">Timeline</Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isDemo ? (
              <Link href="/auth">
                <Button size="sm">Sign in to save</Button>
              </Link>
            ) : (
              <>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
      
      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm text-amber-200">
              <strong>Demo Mode:</strong> Viewing sample data.
            </p>
            <Link href="/auth">
              <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-200">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Timeline</h1>
            <p className="text-muted-foreground">
              {filteredTimeline.length} {filteredTimeline.length === 1 ? 'entry' : 'entries'}
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? 'border-primary text-primary' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <Card className="border-border/50 mb-6">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="receipt">Receipts only</SelectItem>
                      <SelectItem value="moment">Moments only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Decision Type</label>
                  <Select value={decisionTypeFilter} onValueChange={setDecisionTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All decisions</SelectItem>
                      {DECISION_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tag</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tags..."
                      className="pl-10"
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Timeline */}
        {filteredTimeline.length > 0 ? (
          <div className="space-y-3">
            {filteredTimeline.map(item => (
              <Link 
                key={item.id} 
                href={`/app/${item.item_type}/${item.id}`}
              >
                <Card className="border-border/50 hover:border-border transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        item.item_type === 'receipt' 
                          ? 'bg-blue-500/10' 
                          : 'bg-green-500/10'
                      }`}>
                        {item.item_type === 'receipt' 
                          ? <FileText className="w-5 h-5 text-blue-500" />
                          : <Clock className="w-5 h-5 text-green-500" />
                        }
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium">{item.title}</span>
                          <Badge variant={item.item_type === 'receipt' ? 'secondary' : 'outline'} className="text-xs">
                            {item.item_type === 'receipt' ? item.decision_type : item.category}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.item_type === 'receipt' ? item.context : item.note}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.created_at)}
                          </span>
                          {item.item_type === 'receipt' && item.confidence !== null && (
                            <span className="text-xs text-muted-foreground">
                              {item.confidence}% confident
                            </span>
                          )}
                          {item.tags?.length > 0 && (
                            <div className="flex gap-1">
                              {item.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 border-dashed">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                {hasActiveFilters ? (
                  <>
                    <p className="mb-4">No entries match your filters</p>
                    <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                  </>
                ) : (
                  <>
                    <p className="mb-4">No entries yet</p>
                    <div className="flex gap-4 justify-center">
                      <Link href="/dashboard/receipt/new">
                        <Button>New Receipt</Button>
                      </Link>
                      <Link href="/dashboard/moment/new">
                        <Button variant="outline">New Moment</Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

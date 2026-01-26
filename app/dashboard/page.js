'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Layers, FileText, Clock, Plus, AlertTriangle, Lightbulb, 
  LogOut, Settings, List, X, ChevronRight, User
} from 'lucide-react'
import { toast } from 'sonner'
import { demoReceipts, demoMoments, demoPerspectiveCards, demoDeadZone } from '@/lib/demo-data'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  
  // Data
  const [receipts, setReceipts] = useState([])
  const [moments, setMoments] = useState([])
  const [perspectiveCards, setPerspectiveCards] = useState([])
  const [deadZone, setDeadZone] = useState({ flags: [], summary: {} })
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
  
  const checkAuth = async () => {
    const token = localStorage.getItem('supabase_token')
    
    if (!token) {
      // Show demo mode
      setIsDemo(true)
      setReceipts(demoReceipts)
      setMoments(demoMoments)
      setPerspectiveCards(demoPerspectiveCards)
      setDeadZone(demoDeadZone)
      setLoading(false)
      return
    }
    
    try {
      const res = await fetch('/api/auth/user', {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      
      if (data.user) {
        setUser(data.user)
        await loadData()
      } else {
        // Token expired or invalid - show demo
        localStorage.removeItem('supabase_token')
        setIsDemo(true)
        setReceipts(demoReceipts)
        setMoments(demoMoments)
        setPerspectiveCards(demoPerspectiveCards)
        setDeadZone(demoDeadZone)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsDemo(true)
      setReceipts(demoReceipts)
      setMoments(demoMoments)
      setPerspectiveCards(demoPerspectiveCards)
      setDeadZone(demoDeadZone)
    } finally {
      setLoading(false)
    }
  }
  
  const loadData = async () => {
    try {
      const headers = getAuthHeaders()
      
      const [receiptsRes, momentsRes, cardsRes, deadZoneRes] = await Promise.all([
        fetch('/api/receipts', { headers }),
        fetch('/api/moments', { headers }),
        fetch('/api/perspective-cards', { headers }),
        fetch('/api/deadzone', { headers })
      ])
      
      const [receiptsData, momentsData, cardsData, deadZoneData] = await Promise.all([
        receiptsRes.json(),
        momentsRes.json(),
        cardsRes.json(),
        deadZoneRes.json()
      ])
      
      setReceipts(receiptsData.receipts || [])
      setMoments(momentsData.moments || [])
      setPerspectiveCards(cardsData.cards || [])
      setDeadZone({ flags: deadZoneData.flags || [], summary: deadZoneData.summary || {} })
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    }
  }
  
  const handleSignOut = async () => {
    localStorage.removeItem('supabase_token')
    localStorage.removeItem('supabase_refresh_token')
    toast.success('Signed out')
    router.push('/')
  }
  
  const dismissCard = async (cardId) => {
    if (isDemo) {
      setPerspectiveCards(cards => cards.filter(c => c.id !== cardId))
      return
    }
    
    try {
      await fetch(`/api/perspective-cards/${cardId}/dismiss`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      setPerspectiveCards(cards => cards.filter(c => c.id !== cardId))
    } catch (error) {
      toast.error('Failed to dismiss card')
    }
  }
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
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
                <Button variant="ghost" size="sm" className="text-foreground">Dashboard</Button>
              </Link>
              <Link href="/dashboard/timeline">
                <Button variant="ghost" size="sm">Timeline</Button>
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
      
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm text-amber-200">
              <strong>Demo Mode:</strong> You're viewing sample data. Sign in to save your own.
            </p>
            <Link href="/auth">
              <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-200 hover:bg-amber-500/10">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-4">Create</h2>
          <div className="flex gap-4">
            <Link href="/dashboard/receipt/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Receipt
              </Button>
            </Link>
            <Link href="/dashboard/moment/new">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                New Moment
              </Button>
            </Link>
          </div>
        </section>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - DeadZone Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-lg">DeadZone</CardTitle>
                </div>
                <CardDescription>Your last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{deadZone.summary.totalReceipts || 0}</div>
                    <div className="text-xs text-muted-foreground">Receipts</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{deadZone.summary.totalMoments || 0}</div>
                    <div className="text-xs text-muted-foreground">Moments</div>
                  </div>
                </div>
                
                {/* Flags */}
                {deadZone.flags.length > 0 ? (
                  <div className="space-y-3">
                    {deadZone.flags.map((flag, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg border ${
                          flag.severity === 'high' 
                            ? 'border-red-500/30 bg-red-500/5' 
                            : flag.severity === 'medium'
                            ? 'border-amber-500/30 bg-amber-500/5'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className="font-medium text-sm mb-1">{flag.title}</div>
                        <p className="text-xs text-muted-foreground">{flag.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No deadzone flags detected.</p>
                    <p className="text-xs mt-1">Keep capturing context.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Perspective Cards & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Perspective Cards */}
            {perspectiveCards.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-medium">Perspective</h2>
                </div>
                <div className="space-y-3">
                  {perspectiveCards.slice(0, 3).map(card => (
                    <Card key={card.id} className="border-border/50 bg-gradient-to-r from-purple-500/5 to-transparent">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-sm font-medium mb-1">{card.title}</div>
                            <p className="text-sm text-muted-foreground">{card.message}</p>
                            {card.related_type && card.related_id && (
                              <Link 
                                href={`/app/${card.related_type}/${card.related_id}`}
                                className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                              >
                                View {card.related_type} <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0 h-8 w-8"
                            onClick={() => dismissCard(card.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
            
            {/* Recent Activity */}
            <section>
              <Tabs defaultValue="receipts">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="receipts" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Receipts
                    </TabsTrigger>
                    <TabsTrigger value="moments" className="gap-2">
                      <Clock className="w-4 h-4" />
                      Moments
                    </TabsTrigger>
                  </TabsList>
                  <Link href="/dashboard/timeline">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View all <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                
                <TabsContent value="receipts" className="mt-0">
                  {receipts.length > 0 ? (
                    <div className="space-y-3">
                      {receipts.slice(0, 5).map(receipt => (
                        <Link key={receipt.id} href={`/app/receipt/${receipt.id}`}>
                          <Card className="border-border/50 hover:border-border transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium truncate">{receipt.title}</span>
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      {receipt.decision_type}
                                    </Badge>
                                  </div>
                                  {receipt.context && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {receipt.context}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(receipt.created_at)}
                                    </span>
                                    {receipt.confidence !== null && (
                                      <span className="text-xs text-muted-foreground">
                                        • {receipt.confidence}% confident
                                      </span>
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
                      <CardContent className="p-8 text-center">
                        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No receipts yet</p>
                        <Link href="/dashboard/receipt/new">
                          <Button size="sm">Create your first receipt</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="moments" className="mt-0">
                  {moments.length > 0 ? (
                    <div className="space-y-3">
                      {moments.slice(0, 5).map(moment => (
                        <Link key={moment.id} href={`/app/moment/${moment.id}`}>
                          <Card className="border-border/50 hover:border-border transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium truncate">{moment.title}</span>
                                    <Badge variant="outline" className="shrink-0 text-xs">
                                      {moment.category}
                                    </Badge>
                                  </div>
                                  {moment.note && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {moment.note}
                                    </p>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {formatDate(moment.created_at)}
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
                      <CardContent className="p-8 text-center">
                        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No moments yet</p>
                        <Link href="/dashboard/moment/new">
                          <Button size="sm">Capture your first moment</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

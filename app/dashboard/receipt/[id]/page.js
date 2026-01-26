'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, X, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { demoReceipts } from '@/lib/demo-data'

const DECISION_TYPES = ['Career', 'Money', 'Relationship', 'Health', 'Project', 'Other']
const EMOTIONS = ['calm', 'anxious', 'excited', 'pressured', 'uncertain', 'hopeful', 'frustrated', 'confident', 'scared', 'relieved']

export default function ReceiptDetailPage() {
  const router = useRouter()
  const params = useParams()
  const receiptId = params.id
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Receipt data
  const [receipt, setReceipt] = useState(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [decisionType, setDecisionType] = useState('')
  const [context, setContext] = useState('')
  const [assumptions, setAssumptions] = useState('')
  const [constraints, setConstraints] = useState('')
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [confidence, setConfidence] = useState([50])
  const [changeMind, setChangeMind] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  
  useEffect(() => {
    loadReceipt()
  }, [receiptId])
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token')
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' }
  }
  
  const loadReceipt = async () => {
    const token = localStorage.getItem('supabase_token')
    
    if (!token) {
      // Demo mode - load from demo data
      const demoReceipt = demoReceipts.find(r => r.id === receiptId)
      if (demoReceipt) {
        setReceipt(demoReceipt)
        populateForm(demoReceipt)
        setIsDemo(true)
      } else {
        toast.error('Receipt not found')
        router.push('/app')
      }
      setLoading(false)
      return
    }
    
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, {
        headers: getAuthHeaders()
      })
      
      if (!res.ok) {
        throw new Error('Receipt not found')
      }
      
      const data = await res.json()
      setReceipt(data.receipt)
      populateForm(data.receipt)
    } catch (error) {
      toast.error(error.message)
      router.push('/app')
    } finally {
      setLoading(false)
    }
  }
  
  const populateForm = (r) => {
    setTitle(r.title || '')
    setDecisionType(r.decision_type || '')
    setContext(r.context || '')
    setAssumptions(r.assumptions || '')
    setConstraints(r.constraints || '')
    setSelectedEmotions(r.emotions || [])
    setConfidence([r.confidence || 50])
    setChangeMind(r.change_mind || '')
    setTags(r.tags || [])
    setLinkUrl(r.link_url || '')
    setLocationLabel(r.location_label || '')
  }
  
  const toggleEmotion = (emotion) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    )
  }
  
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }
  
  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag))
  }
  
  const handleSave = async () => {
    if (isDemo) {
      toast.error('Sign in to edit receipts')
      return
    }
    
    setSaving(true)
    
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          decision_type: decisionType,
          context: context.trim() || null,
          assumptions: assumptions.trim() || null,
          constraints: constraints.trim() || null,
          emotions: selectedEmotions,
          confidence: confidence[0],
          change_mind: changeMind.trim() || null,
          tags,
          link_url: linkUrl.trim() || null,
          location_label: locationLabel.trim() || null
        })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update receipt')
      }
      
      const data = await res.json()
      setReceipt(data.receipt)
      setIsEditing(false)
      toast.success('Receipt updated')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (isDemo) {
      toast.error('Sign in to delete receipts')
      return
    }
    
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete receipt')
      }
      
      toast.success('Receipt deleted')
      router.push('/app')
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
      <div className="container max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold">{isEditing ? 'Edit Receipt' : receipt?.title}</h1>
            {!isEditing && receipt && (
              <p className="text-muted-foreground">{formatDate(receipt.created_at)}</p>
            )}
          </div>
          
          {!isEditing && !isDemo && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Receipt</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this receipt? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        
        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-200">
              <strong>Demo Mode:</strong> Sign in to edit or delete receipts.
            </p>
          </div>
        )}
        
        {isEditing ? (
          // Edit Form
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Decision Type</Label>
                <Select value={decisionType} onValueChange={setDecisionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="context">Context</Label>
                <Textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assumptions">Assumptions</Label>
                <Textarea
                  id="assumptions"
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints</Label>
                <Textarea
                  id="constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Emotions</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map(emotion => (
                    <Badge
                      key={emotion}
                      variant={selectedEmotions.includes(emotion) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleEmotion(emotion)}
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Confidence Level</Label>
                  <span className="text-sm text-muted-foreground">{confidence[0]}%</span>
                </div>
                <Slider
                  value={confidence}
                  onValueChange={setConfidence}
                  max={100}
                  step={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="changeMind">What would change your mind?</Label>
                <Textarea
                  id="changeMind"
                  value={changeMind}
                  onChange={(e) => setChangeMind(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">Related Link</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => (setIsEditing(false), populateForm(receipt))}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // View Mode
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge>{receipt?.decision_type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {receipt?.confidence}% confident
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {receipt?.context && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Context</h3>
                    <p className="text-foreground whitespace-pre-wrap">{receipt.context}</p>
                  </div>
                )}
                
                {receipt?.assumptions && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Assumptions</h3>
                    <p className="text-foreground whitespace-pre-wrap">{receipt.assumptions}</p>
                  </div>
                )}
                
                {receipt?.constraints && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Constraints</h3>
                    <p className="text-foreground whitespace-pre-wrap">{receipt.constraints}</p>
                  </div>
                )}
                
                {receipt?.emotions?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Emotions</h3>
                    <div className="flex flex-wrap gap-2">
                      {receipt.emotions.map(emotion => (
                        <Badge key={emotion} variant="secondary" className="capitalize">
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {receipt?.change_mind && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">What would change my mind</h3>
                    <p className="text-foreground">{receipt.change_mind}</p>
                  </div>
                )}
                
                {receipt?.tags?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {receipt.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {(receipt?.link_url || receipt?.location_label) && (
                  <div className="flex gap-6 text-sm">
                    {receipt?.link_url && (
                      <div>
                        <span className="text-muted-foreground">Link: </span>
                        <a href={receipt.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {receipt.link_url}
                        </a>
                      </div>
                    )}
                    {receipt?.location_label && (
                      <div>
                        <span className="text-muted-foreground">Location: </span>
                        <span>{receipt.location_label}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

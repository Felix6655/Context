'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

const DECISION_TYPES = ['Career', 'Money', 'Relationship', 'Health', 'Project', 'Other']
const EMOTIONS = ['calm', 'anxious', 'excited', 'pressured', 'uncertain', 'hopeful', 'frustrated', 'confident', 'scared', 'relieved']

export default function NewReceiptPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  
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
    const token = localStorage.getItem('supabase_token')
    if (!token) {
      setIsDemo(true)
    }
  }, [])
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token')
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' }
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
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isDemo) {
      toast.error('Sign in to save receipts')
      router.push('/auth')
      return
    }
    
    if (!title.trim() || !decisionType) {
      toast.error('Title and decision type are required')
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
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
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create receipt')
      }
      
      toast.success('Receipt created')
      router.push('/app')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold">New Receipt</h1>
          <p className="text-muted-foreground">Log the context behind your decision</p>
        </div>
        
        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-200">
              <strong>Demo Mode:</strong> Sign in to save your receipts.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Decision Details</CardTitle>
              <CardDescription>What are you deciding and why?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Accepted the remote position"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              {/* Decision Type */}
              <div className="space-y-2">
                <Label>Decision Type *</Label>
                <Select value={decisionType} onValueChange={setDecisionType} required>
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
              
              {/* Context */}
              <div className="space-y-2">
                <Label htmlFor="context">Context</Label>
                <Textarea
                  id="context"
                  placeholder="What's the situation? What led to this decision?"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                />
              </div>
              
              {/* Assumptions */}
              <div className="space-y-2">
                <Label htmlFor="assumptions">Assumptions</Label>
                <Textarea
                  id="assumptions"
                  placeholder="What are you assuming to be true? (One per line)"
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Constraints */}
              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints</Label>
                <Textarea
                  id="constraints"
                  placeholder="What limits or constraints exist? (One per line)"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Emotions */}
              <div className="space-y-3">
                <Label>How are you feeling?</Label>
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
              
              {/* Confidence */}
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
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uncertain</span>
                  <span>Very confident</span>
                </div>
              </div>
              
              {/* What would change my mind */}
              <div className="space-y-2">
                <Label htmlFor="changeMind">What would change your mind?</Label>
                <Textarea
                  id="changeMind"
                  placeholder="Under what circumstances would you reconsider?"
                  value={changeMind}
                  onChange={(e) => setChangeMind(e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Tags */}
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
              
              {/* Optional: Link & Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">Related Link (optional)</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Home office"
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4 mt-6">
            <Link href="/dashboard">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Receipt
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

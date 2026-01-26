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
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['People', 'Place', 'Routine', 'Work', 'Family', 'Other']

export default function NewMomentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [whyMattered, setWhyMattered] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  
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
      toast.error('Sign in to save moments')
      router.push('/auth')
      return
    }
    
    if (!title.trim() || !category) {
      toast.error('Title and category are required')
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/moments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          category,
          note: note.trim() || null,
          why_mattered: whyMattered.trim() || null,
          tags
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create moment')
      }
      
      toast.success('Moment captured')
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
          <Link href="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold">New Moment</h1>
          <p className="text-muted-foreground">Capture something worth remembering</p>
        </div>
        
        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-200">
              <strong>Demo Mode:</strong> Sign in to save your moments.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Moment Details</CardTitle>
              <CardDescription>What do you want to remember?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Last soccer practice of the season"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  placeholder="What happened? What did you notice?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Why it mattered */}
              <div className="space-y-2">
                <Label htmlFor="whyMattered">Why it mattered today</Label>
                <Textarea
                  id="whyMattered"
                  placeholder="Why is this worth remembering?"
                  value={whyMattered}
                  onChange={(e) => setWhyMattered(e.target.value)}
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
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4 mt-6">
            <Link href="/app">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Moment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

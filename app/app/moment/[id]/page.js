'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, X, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { demoMoments } from '@/lib/demo-data'

const CATEGORIES = ['People', 'Place', 'Routine', 'Work', 'Family', 'Other']

export default function MomentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const momentId = params.id
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Moment data
  const [moment, setMoment] = useState(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [whyMattered, setWhyMattered] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  
  useEffect(() => {
    loadMoment()
  }, [momentId])
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token')
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' }
  }
  
  const loadMoment = async () => {
    const token = localStorage.getItem('supabase_token')
    
    if (!token) {
      const demoMoment = demoMoments.find(m => m.id === momentId)
      if (demoMoment) {
        setMoment(demoMoment)
        populateForm(demoMoment)
        setIsDemo(true)
      } else {
        toast.error('Moment not found')
        router.push('/app')
      }
      setLoading(false)
      return
    }
    
    try {
      const res = await fetch(`/api/moments/${momentId}`, {
        headers: getAuthHeaders()
      })
      
      if (!res.ok) {
        throw new Error('Moment not found')
      }
      
      const data = await res.json()
      setMoment(data.moment)
      populateForm(data.moment)
    } catch (error) {
      toast.error(error.message)
      router.push('/app')
    } finally {
      setLoading(false)
    }
  }
  
  const populateForm = (m) => {
    setTitle(m.title || '')
    setCategory(m.category || '')
    setNote(m.note || '')
    setWhyMattered(m.why_mattered || '')
    setTags(m.tags || [])
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
      toast.error('Sign in to edit moments')
      return
    }
    
    setSaving(true)
    
    try {
      const res = await fetch(`/api/moments/${momentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          category,
          note: note.trim() || null,
          why_mattered: whyMattered.trim() || null,
          tags
        })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update moment')
      }
      
      const data = await res.json()
      setMoment(data.moment)
      setIsEditing(false)
      toast.success('Moment updated')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (isDemo) {
      toast.error('Sign in to delete moments')
      return
    }
    
    try {
      const res = await fetch(`/api/moments/${momentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete moment')
      }
      
      toast.success('Moment deleted')
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
            <Link href="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold">{isEditing ? 'Edit Moment' : moment?.title}</h1>
            {!isEditing && moment && (
              <p className="text-muted-foreground">{formatDate(moment.created_at)}</p>
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
                    <DialogTitle>Delete Moment</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this moment? This action cannot be undone.
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
              <strong>Demo Mode:</strong> Sign in to edit or delete moments.
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
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
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
              
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whyMattered">Why it mattered</Label>
                <Textarea
                  id="whyMattered"
                  value={whyMattered}
                  onChange={(e) => setWhyMattered(e.target.value)}
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
              
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => (setIsEditing(false), populateForm(moment))}>
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
          <Card className="border-border/50">
            <CardHeader>
              <Badge variant="outline" className="w-fit">{moment?.category}</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {moment?.note && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Note</h3>
                  <p className="text-foreground whitespace-pre-wrap">{moment.note}</p>
                </div>
              )}
              
              {moment?.why_mattered && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Why it mattered</h3>
                  <p className="text-foreground whitespace-pre-wrap">{moment.why_mattered}</p>
                </div>
              )}
              
              {moment?.tags?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {moment.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

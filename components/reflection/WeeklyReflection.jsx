'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TrendingUp, TrendingDown, Minus, FileText, Clock, MessageCircle, Lightbulb, Save } from 'lucide-react'
import { useState } from 'react'

export function WeeklyReflectionView({ reflection, onSave, onAddNotes }) {
  const [notes, setNotes] = useState(reflection?.user_notes || '')
  const [saving, setSaving] = useState(false)
  
  if (!reflection) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No reflection available yet.</p>
        </CardContent>
      </Card>
    )
  }
  
  const summary = reflection.summary || {}
  const trend = summary.confidence_trend || {}
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave?.({ ...reflection, user_notes: notes })
    } finally {
      setSaving(false)
    }
  }
  
  // Trend icon
  const TrendIcon = trend.trend === 'rising' ? TrendingUp 
    : trend.trend === 'falling' ? TrendingDown 
    : Minus
  
  const trendColor = trend.trend === 'rising' ? 'text-green-500'
    : trend.trend === 'falling' ? 'text-amber-500'
    : 'text-muted-foreground'
  
  return (
    <div className="space-y-6">
      {/* Period Header */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Weekly Reflection</CardTitle>
          <CardDescription>
            {formatDateRange(reflection.period?.start, reflection.period?.end)}
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.receipts_count || 0}</p>
                <p className="text-xs text-muted-foreground">Receipts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.moments_count || 0}</p>
                <p className="text-xs text-muted-foreground">Moments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="text-lg font-bold text-purple-500">
                  {summary.average_confidence ?? '-'}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Confidence</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center ${trendColor}`}>
                <TrendIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium capitalize">{trend.trend || 'Stable'}</p>
                <p className="text-xs text-muted-foreground">
                  {trend.delta !== null ? `${trend.delta > 0 ? '+' : ''}${trend.delta}%` : 'vs baseline'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Emotions & Patterns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Dominant Emotions */}
        {summary.dominant_emotions?.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dominant Emotions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {summary.dominant_emotions.map(({ emotion, count }) => (
                  <Badge key={emotion} variant="secondary" className="capitalize">
                    {emotion} ({count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Repeating Tags */}
        {summary.repeating_tags?.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recurring Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {summary.repeating_tags.map(({ tag, count }) => (
                  <Badge key={tag} variant="outline">
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Reflection Question */}
      {reflection.reflection?.question && (
        <Card className="border-border/50 bg-gradient-to-r from-purple-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Reflection</p>
                <p className="text-muted-foreground">{reflection.reflection.question}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Suggested Action */}
      {reflection.reflection?.suggested_action && (
        <Card className="border-border/50 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Consider</p>
                <p className="text-muted-foreground">{reflection.reflection.suggested_action}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* User Notes */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Notes</CardTitle>
          <CardDescription>Optional - add your own thoughts</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What are you thinking about this week?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mb-4"
          />
          {onSave && !reflection.saved && (
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Reflection'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatDateRange(start, end) {
  if (!start || !end) return 'This week'
  
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const options = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
}

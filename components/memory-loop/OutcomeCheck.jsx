'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, ChevronRight, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'

const OUTCOME_OPTIONS = [
  { value: 'better', label: 'Better than expected', icon: TrendingUp, color: 'text-green-500' },
  { value: 'expected', label: 'As expected', icon: Minus, color: 'text-blue-500' },
  { value: 'worse', label: 'Worse than expected', icon: TrendingDown, color: 'text-amber-500' },
  { value: 'unsure', label: 'Not sure yet', icon: HelpCircle, color: 'text-muted-foreground' }
]

export function OutcomeCheckPrompt({ check, onSubmit, onDismiss }) {
  const [selectedOutcome, setSelectedOutcome] = useState(null)
  const [showDeltaInput, setShowDeltaInput] = useState(false)
  const [assumptionDelta, setAssumptionDelta] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  if (!check) return null
  
  const handleOutcomeSelect = (outcome) => {
    setSelectedOutcome(outcome)
    if (outcome !== 'dismissed') {
      setShowDeltaInput(true)
    }
  }
  
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        receipt_id: check.receipt_id,
        outcome: selectedOutcome,
        assumption_delta: assumptionDelta.trim() || null
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleDismiss = async () => {
    await onDismiss(check.receipt_id)
  }
  
  return (
    <Card className="border-border/50 bg-gradient-to-r from-blue-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Outcome check</CardTitle>
            <CardDescription>
              {check.days_since} days since this decision
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Receipt info */}
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{check.receipt_title}</span>
            <Badge variant="secondary" className="text-xs">{check.receipt_decision_type}</Badge>
          </div>
          {check.receipt_confidence && (
            <p className="text-sm text-muted-foreground">
              {check.receipt_confidence}% confident at the time
            </p>
          )}
        </div>
        
        {!showDeltaInput ? (
          /* Outcome selection */
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">How did this decision turn out?</p>
            {OUTCOME_OPTIONS.map(option => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => handleOutcomeSelect(option.value)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-colors text-left"
                >
                  <Icon className={`w-5 h-5 ${option.color}`} />
                  <span className="text-sm">{option.label}</span>
                </button>
              )
            })}
          </div>
        ) : (
          /* Delta capture */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{selectedOutcome?.replace('_', ' ')}</Badge>
              <button
                onClick={() => setShowDeltaInput(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Change
              </button>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                What was different from what you assumed? <span className="text-xs">(optional)</span>
              </p>
              <Textarea
                value={assumptionDelta}
                onChange={(e) => setAssumptionDelta(e.target.value)}
                placeholder="The timeline was shorter than I thought..."
                rows={2}
                className="resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeltaInput(false)}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Insight Card - displays pattern insights
export function InsightCard({ insight, onDismiss, onView }) {
  const [dismissed, setDismissed] = useState(false)
  
  if (!insight || dismissed) return null
  
  const handleDismiss = async () => {
    setDismissed(true)
    await onDismiss?.(insight.id)
  }
  
  // Color based on direction
  const bgColor = insight.pattern_data?.direction === 'worse' 
    ? 'from-amber-500/5'
    : insight.pattern_data?.direction === 'better'
    ? 'from-green-500/5'
    : 'from-purple-500/5'
  
  return (
    <Card className={`border-border/50 bg-gradient-to-r ${bgColor} to-transparent`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Pattern observed</p>
            <p className="text-sm text-muted-foreground">{insight.message}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Based on {insight.sample_size} decisions
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Weekly Learning Section
export function WeeklyLearningSection({ autoLearning, userLearning, onSave }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(userLearning || '')
  const [saving, setSaving] = useState(false)
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave?.(text)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">One thing learned this week</CardTitle>
        <CardDescription>
          From your decisions and outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {autoLearning && !userLearning && !editing && (
          <div className="p-3 bg-muted/30 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground italic">{autoLearning}</p>
          </div>
        )}
        
        {editing ? (
          <div className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's something you learned from your decisions this week?"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {userLearning ? (
              <p className="text-sm mb-3">{userLearning}</p>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">
                No learning captured yet
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {userLearning ? 'Edit' : 'Add your own'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

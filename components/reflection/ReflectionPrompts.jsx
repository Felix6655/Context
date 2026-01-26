'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, MessageCircle } from 'lucide-react'

// Silence Prompt Component - appears when user has been quiet
export function SilencePrompt({ prompt, onDismiss }) {
  const [dismissed, setDismissed] = useState(false)
  
  if (!prompt || dismissed) return null
  
  const handleDismiss = async () => {
    setDismissed(true)
    if (onDismiss) {
      await onDismiss()
    }
  }
  
  return (
    <Card className="border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{prompt.title || 'A quiet moment'}</p>
              <p className="text-sm text-muted-foreground">{prompt.message}</p>
              {prompt.daysSinceActivity && (
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {prompt.daysSinceActivity} days since last entry
                </p>
              )}
            </div>
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

// Perspective Card Component - contextual, dismissible
export function PerspectiveCard({ card, context, onDismiss, onViewRelated }) {
  const [dismissed, setDismissed] = useState(false)
  
  if (!card || dismissed) return null
  
  const handleDismiss = async () => {
    setDismissed(true)
    if (onDismiss) {
      await onDismiss(card.id)
    }
  }
  
  // Color coding by type
  const typeColors = {
    'low-confidence': 'from-amber-500/10',
    'assumption-expired': 'from-orange-500/10',
    'gap': 'from-blue-500/10',
    'category-lock': 'from-purple-500/10',
    'anniversary': 'from-green-500/10',
    'deadzone': 'from-red-500/10'
  }
  
  const bgColor = typeColors[card.type] || 'from-muted/30'
  
  return (
    <Card className={`border-border/50 bg-gradient-to-r ${bgColor} to-transparent`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">{card.title}</p>
            <p className="text-sm text-muted-foreground">{card.message}</p>
            {card.related_type && card.related_id && onViewRelated && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-2 text-xs"
                onClick={() => onViewRelated(card.related_type, card.related_id)}
              >
                View {card.related_type} →
              </Button>
            )}
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

// Notification Bell with Count
export function NotificationBell({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <svg
        className="w-5 h-5 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}

// Notification Item
export function NotificationItem({ notification, onRead, onDismiss }) {
  const handleClick = () => {
    if (!notification.read && onRead) {
      onRead(notification.id)
    }
  }
  
  return (
    <div
      className={`p-3 border-b border-border/50 last:border-0 cursor-pointer transition-colors ${
        notification.read ? 'bg-transparent' : 'bg-muted/30'
      } hover:bg-muted/50`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-medium'}`}>
            {notification.title}
          </p>
          {notification.message && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss?.(notification.id)
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

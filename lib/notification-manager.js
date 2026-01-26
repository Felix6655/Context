// Notification Manager
// Minimal, smart in-app notifications

import { v4 as uuidv4 } from 'uuid'

// Notification types and their configurations
const NOTIFICATION_TYPES = {
  'silence-nudge': {
    title: 'Quiet period',
    priority: 'low',
    dismissAfterDays: 7,
    maxPerWeek: 1
  },
  'weekly-reflection-ready': {
    title: 'Weekly reflection',
    priority: 'medium',
    dismissAfterDays: 3,
    maxPerWeek: 1
  },
  'capture-reminder': {
    title: 'Gentle reminder',
    priority: 'low',
    dismissAfterDays: 1,
    maxPerWeek: 2
  },
  'perspective-card': {
    title: 'Something to consider',
    priority: 'low',
    dismissAfterDays: 7,
    maxPerWeek: 3
  }
}

// Check if notification should be created
export function shouldCreateNotification(type, existingNotifications = [], settings = {}) {
  const config = NOTIFICATION_TYPES[type]
  if (!config) return false
  
  // Check user settings
  if (type === 'silence-nudge' && settings.silence_nudges_enabled === false) return false
  if (type === 'weekly-reflection-ready' && settings.weekly_reflections_enabled === false) return false
  if (type === 'capture-reminder' && settings.capture_reminders_enabled === false) return false
  
  // Check rate limiting
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentOfType = existingNotifications.filter(n => 
    n.type === type && new Date(n.created_at) > oneWeekAgo
  )
  
  if (recentOfType.length >= config.maxPerWeek) return false
  
  // Check for duplicate unread notifications
  const unreadOfType = existingNotifications.filter(n => 
    n.type === type && !n.read && !n.dismissed
  )
  
  if (unreadOfType.length > 0) return false
  
  return true
}

// Create a notification object
export function createNotification(type, data = {}) {
  const config = NOTIFICATION_TYPES[type]
  if (!config) return null
  
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + config.dismissAfterDays)
  
  return {
    id: uuidv4(),
    type,
    title: data.title || config.title,
    message: data.message || '',
    priority: config.priority,
    read: false,
    dismissed: false,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    metadata: data.metadata || {}
  }
}

// Get active (non-expired, non-dismissed) notifications
export function getActiveNotifications(notifications) {
  const now = new Date()
  
  return notifications.filter(n => {
    if (n.dismissed) return false
    if (n.expires_at && new Date(n.expires_at) < now) return false
    return true
  }).sort((a, b) => {
    // Sort by priority then date
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const aPriority = priorityOrder[a.priority] || 2
    const bPriority = priorityOrder[b.priority] || 2
    
    if (aPriority !== bPriority) return aPriority - bPriority
    return new Date(b.created_at) - new Date(a.created_at)
  })
}

// Get unread count
export function getUnreadCount(notifications) {
  return getActiveNotifications(notifications).filter(n => !n.read).length
}

// Check if it's time for weekly reflection based on user settings
export function isWeeklyReflectionTime(settings) {
  if (settings.weekly_reflections_enabled === false) return false
  
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours()
  
  const preferredDay = settings.reflection_day ?? 0 // Default Sunday
  const preferredHour = settings.reflection_hour ?? 18 // Default 6 PM
  
  // Check if it's the right day and within the hour window
  if (currentDay !== preferredDay) return false
  if (currentHour < preferredHour || currentHour > preferredHour + 2) return false
  
  return true
}

// Format notification for display
export function formatNotificationMessage(notification) {
  const messages = {
    'silence-nudge': (n) => n.message || "It's been quiet. When you're ready, there's space here.",
    'weekly-reflection-ready': (n) => n.message || "Your weekly reflection is ready to view.",
    'capture-reminder': (n) => n.message || "A gentle nudge to capture what matters.",
    'perspective-card': (n) => n.message || "Something worth considering."
  }
  
  const formatter = messages[notification.type]
  return formatter ? formatter(notification) : notification.message
}

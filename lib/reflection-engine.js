// Context Reflection Engine
// Thoughtful, minimal, non-preachy reflection system

import { computeDeadZoneFlags } from './deadzone'

// Tone configurations for reflection messages
const TONE_CONFIGS = {
  neutral: {
    silencePrompts: [
      "It's been quiet here. Anything worth noting?",
      "Some time has passed. What's been on your mind?",
      "A gap in the record. Want to fill it in?"
    ],
    reflectionQuestions: [
      "What's something you noticed this week?",
      "Any decisions still sitting with you?",
      "What felt different about this week?"
    ],
    suggestedActions: [
      "Consider noting one thing before the week ends.",
      "A quick moment capture might help.",
      "Even a small note can provide future context."
    ]
  },
  gentle: {
    silencePrompts: [
      "When you're ready, there's space here.",
      "No rush. Just here when you need it.",
      "The record is patient. So are we."
    ],
    reflectionQuestions: [
      "What's been weighing on you, if anything?",
      "Is there something you'd want your future self to know?",
      "What mattered this week, even if it seemed small?"
    ],
    suggestedActions: [
      "If something comes to mind, you could jot it down.",
      "Sometimes a brief note helps clear the mind.",
      "There's no pressure—just an option."
    ]
  },
  direct: {
    silencePrompts: [
      "Nothing logged recently. Time to check in.",
      "Gap detected. Worth documenting?",
      "Silence in the record. Intentional?"
    ],
    reflectionQuestions: [
      "What decision are you avoiding?",
      "What's the one thing you should have logged?",
      "What pattern are you noticing?"
    ],
    suggestedActions: [
      "Log one receipt or moment now.",
      "Document that pending decision.",
      "Capture what you're thinking before it fades."
    ]
  }
}

// Get a random item from array
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Check if user is in silence period
export function detectSilence(receipts, moments, settings = {}) {
  const silenceDays = settings.silence_threshold_days || 5
  const now = new Date()
  
  const allItems = [...receipts, ...moments]
  if (allItems.length === 0) {
    return { inSilence: true, daysSinceActivity: 999, reason: 'no-activity-ever' }
  }
  
  const lastActivity = allItems.reduce((latest, item) => {
    const itemDate = new Date(item.created_at)
    return itemDate > latest ? itemDate : latest
  }, new Date(0))
  
  const daysSince = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))
  
  return {
    inSilence: daysSince >= silenceDays,
    daysSinceActivity: daysSince,
    lastActivityDate: lastActivity.toISOString(),
    reason: daysSince >= silenceDays ? 'silence-threshold-exceeded' : null
  }
}

// Generate silence prompt (one per silence window)
export function generateSilencePrompt(silenceInfo, settings = {}, existingPrompts = []) {
  if (!silenceInfo.inSilence) return null
  
  const tone = settings.reflection_tone || 'gentle'
  const config = TONE_CONFIGS[tone] || TONE_CONFIGS.gentle
  
  // Check if we already showed a prompt for this silence window
  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - silenceInfo.daysSinceActivity)
  
  const recentPrompt = existingPrompts.find(p => {
    const promptDate = new Date(p.created_at)
    return promptDate >= windowStart && p.type === 'silence-nudge'
  })
  
  if (recentPrompt) return null // Already showed one this window
  
  return {
    type: 'silence-nudge',
    title: 'A quiet moment',
    message: pickRandom(config.silencePrompts),
    daysSinceActivity: silenceInfo.daysSinceActivity,
    dismissible: true,
    tone
  }
}

// Compute weekly summary statistics
export function computeWeeklySummary(receipts, moments, weekStart, weekEnd) {
  const weekReceipts = receipts.filter(r => {
    const date = new Date(r.created_at)
    return date >= weekStart && date <= weekEnd
  })
  
  const weekMoments = moments.filter(m => {
    const date = new Date(m.created_at)
    return date >= weekStart && date <= weekEnd
  })
  
  // Count emotions across receipts
  const emotionCounts = {}
  weekReceipts.forEach(r => {
    (r.emotions || []).forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1
    })
  })
  
  // Sort emotions by frequency
  const dominantEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion, count]) => ({ emotion, count }))
  
  // Calculate average confidence
  const confidences = weekReceipts
    .filter(r => r.confidence !== null && r.confidence !== undefined)
    .map(r => r.confidence)
  
  const avgConfidence = confidences.length > 0
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : null
  
  // Decision types breakdown
  const decisionTypes = {}
  weekReceipts.forEach(r => {
    decisionTypes[r.decision_type] = (decisionTypes[r.decision_type] || 0) + 1
  })
  
  // Moment categories breakdown
  const momentCategories = {}
  weekMoments.forEach(m => {
    momentCategories[m.category] = (momentCategories[m.category] || 0) + 1
  })
  
  // Find repeating tags
  const allTags = [
    ...weekReceipts.flatMap(r => r.tags || []),
    ...weekMoments.flatMap(m => m.tags || [])
  ]
  const tagCounts = {}
  allTags.forEach(t => {
    tagCounts[t] = (tagCounts[t] || 0) + 1
  })
  const repeatingTags = Object.entries(tagCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))
  
  // Extract assumptions for pattern detection
  const assumptions = weekReceipts
    .filter(r => r.assumptions && r.assumptions.trim())
    .map(r => ({ title: r.title, assumptions: r.assumptions }))
  
  return {
    period: {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString()
    },
    counts: {
      receipts: weekReceipts.length,
      moments: weekMoments.length,
      total: weekReceipts.length + weekMoments.length
    },
    emotions: {
      dominant: dominantEmotions,
      total: Object.values(emotionCounts).reduce((a, b) => a + b, 0)
    },
    confidence: {
      average: avgConfidence,
      samples: confidences.length
    },
    decisionTypes,
    momentCategories,
    patterns: {
      repeatingTags,
      assumptionsLogged: assumptions.length
    },
    raw: {
      receipts: weekReceipts,
      moments: weekMoments
    }
  }
}

// Calculate confidence trend vs baseline
export function calculateConfidenceTrend(allReceipts, weekReceipts) {
  // Baseline: all receipts except this week
  const weekReceiptIds = new Set(weekReceipts.map(r => r.id))
  const baselineReceipts = allReceipts.filter(r => !weekReceiptIds.has(r.id))
  
  const baselineConfidences = baselineReceipts
    .filter(r => r.confidence !== null)
    .map(r => r.confidence)
  
  const weekConfidences = weekReceipts
    .filter(r => r.confidence !== null)
    .map(r => r.confidence)
  
  if (baselineConfidences.length === 0 || weekConfidences.length === 0) {
    return { trend: 'insufficient-data', baseline: null, current: null, delta: null }
  }
  
  const baselineAvg = Math.round(baselineConfidences.reduce((a, b) => a + b, 0) / baselineConfidences.length)
  const weekAvg = Math.round(weekConfidences.reduce((a, b) => a + b, 0) / weekConfidences.length)
  const delta = weekAvg - baselineAvg
  
  let trend = 'stable'
  if (delta >= 10) trend = 'rising'
  else if (delta <= -10) trend = 'falling'
  
  return { trend, baseline: baselineAvg, current: weekAvg, delta }
}

// Generate reflection question based on summary
export function generateReflectionQuestion(summary, confidenceTrend, settings = {}) {
  const tone = settings.reflection_tone || 'gentle'
  const config = TONE_CONFIGS[tone] || TONE_CONFIGS.gentle
  
  // Context-aware questions
  const contextQuestions = []
  
  // If low activity
  if (summary.counts.total === 0) {
    contextQuestions.push("What kept you from logging this week?")
    contextQuestions.push("Was it a quiet week, or just undocumented?")
  }
  
  // If confidence is falling
  if (confidenceTrend.trend === 'falling') {
    contextQuestions.push("Your confidence seems lower than usual. What's creating uncertainty?")
    contextQuestions.push("What would help you feel more certain about recent decisions?")
  }
  
  // If anxiety/pressure emotions dominate
  const anxiousEmotions = ['anxious', 'pressured', 'uncertain', 'scared']
  const dominantAnxious = summary.emotions.dominant.some(e => anxiousEmotions.includes(e.emotion))
  if (dominantAnxious) {
    contextQuestions.push("There's some tension in your recent entries. What's driving it?")
    contextQuestions.push("What would need to change for you to feel calmer about things?")
  }
  
  // If single decision type dominates
  const typeEntries = Object.entries(summary.decisionTypes)
  if (typeEntries.length === 1 && summary.counts.receipts >= 2) {
    const dominantType = typeEntries[0][0]
    contextQuestions.push(`All your decisions this week were ${dominantType}-related. Is that where your focus should be?`)
  }
  
  // Default to generic questions if no context triggers
  if (contextQuestions.length === 0) {
    return pickRandom(config.reflectionQuestions)
  }
  
  return pickRandom(contextQuestions)
}

// Generate suggested action based on summary
export function generateSuggestedAction(summary, settings = {}) {
  const tone = settings.reflection_tone || 'gentle'
  const config = TONE_CONFIGS[tone] || TONE_CONFIGS.gentle
  
  const contextActions = []
  
  // If no receipts but moments exist
  if (summary.counts.receipts === 0 && summary.counts.moments > 0) {
    contextActions.push("You captured moments but no decisions. Were there choices you didn't log?")
  }
  
  // If no moments but receipts exist
  if (summary.counts.moments === 0 && summary.counts.receipts > 0) {
    contextActions.push("All decisions, no moments. What small things might be worth remembering?")
  }
  
  // If assumptions were logged, suggest review
  if (summary.patterns.assumptionsLogged > 0) {
    contextActions.push("You logged assumptions this week. Consider marking a reminder to check them later.")
  }
  
  // If repeating tags
  if (summary.patterns.repeatingTags.length > 0) {
    const topTag = summary.patterns.repeatingTags[0].tag
    contextActions.push(`"${topTag}" keeps appearing. Is that a theme worth exploring?`)
  }
  
  if (contextActions.length === 0) {
    return pickRandom(config.suggestedActions)
  }
  
  return pickRandom(contextActions)
}

// Generate full weekly reflection
export function generateWeeklyReflection(receipts, moments, allReceipts, settings = {}) {
  const now = new Date()
  const weekEnd = new Date(now)
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)
  
  const summary = computeWeeklySummary(receipts, moments, weekStart, weekEnd)
  const confidenceTrend = calculateConfidenceTrend(allReceipts, summary.raw.receipts)
  const reflectionQuestion = generateReflectionQuestion(summary, confidenceTrend, settings)
  const suggestedAction = generateSuggestedAction(summary, settings)
  
  return {
    generated_at: now.toISOString(),
    period: summary.period,
    summary: {
      receipts_count: summary.counts.receipts,
      moments_count: summary.counts.moments,
      total_entries: summary.counts.total,
      dominant_emotions: summary.emotions.dominant,
      average_confidence: summary.confidence.average,
      confidence_trend: confidenceTrend,
      decision_types: summary.decisionTypes,
      moment_categories: summary.momentCategories,
      repeating_tags: summary.patterns.repeatingTags
    },
    reflection: {
      question: reflectionQuestion,
      suggested_action: suggestedAction
    },
    tone: settings.reflection_tone || 'gentle'
  }
}

// Determine if a perspective card should be shown
export function shouldShowPerspectiveCard(context, existingCards = [], settings = {}) {
  // Contexts: 'after-save', 'weekly-reflection', 'silence-detection', 'dashboard'
  const validContexts = ['after-save', 'weekly-reflection', 'silence-detection']
  
  if (!validContexts.includes(context)) return false
  
  // Check for non-dismissed cards
  const activeCards = existingCards.filter(c => !c.dismissed)
  if (activeCards.length === 0) return false
  
  // Only show one at a time - check if user dismissed recently (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentlyDismissed = existingCards.some(c => 
    c.dismissed && new Date(c.updated_at || c.created_at) > oneHourAgo
  )
  
  if (recentlyDismissed) return false
  
  return true
}

// Select which perspective card to show
export function selectPerspectiveCard(cards, context) {
  const activeCards = cards.filter(c => !c.dismissed)
  if (activeCards.length === 0) return null
  
  // Prioritize by context relevance
  const priorityMap = {
    'after-save': ['low-confidence', 'assumption-expired', 'anniversary'],
    'weekly-reflection': ['category-lock', 'gap', 'assumption-expired'],
    'silence-detection': ['gap', 'deadzone']
  }
  
  const priorities = priorityMap[context] || []
  
  // Find first matching priority
  for (const type of priorities) {
    const match = activeCards.find(c => c.type === type)
    if (match) return match
  }
  
  // Otherwise return most recent
  return activeCards.sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  )[0]
}

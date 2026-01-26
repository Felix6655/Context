// Perspective Cards (One Last Time) - Generate prompts based on rules
// No AI/ML - just rule-based generation

import { v4 as uuidv4 } from 'uuid'

export function generatePerspectiveCards(receipts, moments, existingCards = [], intensity = 'medium') {
  const newCards = []
  const now = new Date()
  const dismissedIds = new Set(existingCards.filter(c => c.dismissed).map(c => c.related_id))
  
  // Intensity multipliers for message frequency
  const intensityConfig = {
    low: { silenceGapDays: 7, categoryRepeatCount: 8, lowConfidenceAge: 45, assumptionAge: 90 },
    medium: { silenceGapDays: 5, categoryRepeatCount: 6, lowConfidenceAge: 30, assumptionAge: 60 },
    high: { silenceGapDays: 3, categoryRepeatCount: 4, lowConfidenceAge: 14, assumptionAge: 30 }
  }
  const config = intensityConfig[intensity] || intensityConfig.medium
  
  // Rule 1: Silence gap >= threshold days
  const recentItems = [...receipts, ...moments].filter(i => {
    const age = (now - new Date(i.created_at)) / (24 * 60 * 60 * 1000)
    return age <= 14
  })
  
  if (recentItems.length === 0 || findSilenceGap(recentItems) >= config.silenceGapDays) {
    const cardId = 'silence-gap-' + now.toISOString().split('T')[0]
    if (!existingCards.some(c => c.id === cardId || c.type === 'gap')) {
      newCards.push({
        id: uuidv4(),
        type: 'gap',
        title: 'Silence in the record',
        message: "You haven't captured context in a while. If this season ends suddenly, what would you wish you recorded?",
        related_type: null,
        related_id: null,
        dismissed: false
      })
    }
  }
  
  // Rule 2: Moment category repeats 6+ times in 14 days
  const recentMoments = moments.filter(m => {
    const age = (now - new Date(m.created_at)) / (24 * 60 * 60 * 1000)
    return age <= 14
  })
  
  const categoryCounts = {}
  recentMoments.forEach(m => {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1
  })
  
  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count >= config.categoryRepeatCount) {
      const cardKey = `category-${category}`
      if (!existingCards.some(c => c.type === 'category-lock' && c.message.includes(category))) {
        newCards.push({
          id: uuidv4(),
          type: 'category-lock',
          title: `Living inside ${category}`,
          message: `You've been living inside ${category}. If this is one of the last weeks like this, what matters most?`,
          related_type: null,
          related_id: null,
          dismissed: false
        })
      }
    }
  }
  
  // Rule 3: Low confidence receipt (<=40) older than threshold days
  receipts.forEach(receipt => {
    const age = (now - new Date(receipt.created_at)) / (24 * 60 * 60 * 1000)
    if (receipt.confidence <= 40 && age >= config.lowConfidenceAge && !dismissedIds.has(receipt.id)) {
      if (!existingCards.some(c => c.related_id === receipt.id && c.type === 'low-confidence')) {
        newCards.push({
          id: uuidv4(),
          type: 'low-confidence',
          title: 'Uncertain decision revisit',
          message: `You made a low-confidence decision "${receipt.title}" ${Math.floor(age)} days ago. Is the original context still true?`,
          related_type: 'receipt',
          related_id: receipt.id,
          dismissed: false
        })
      }
    }
  })
  
  // Rule 4: Assumptions field check for old receipts
  receipts.forEach(receipt => {
    const age = (now - new Date(receipt.created_at)) / (24 * 60 * 60 * 1000)
    if (receipt.assumptions && receipt.assumptions.trim().length > 0 && age >= config.assumptionAge && !dismissedIds.has(receipt.id)) {
      if (!existingCards.some(c => c.related_id === receipt.id && c.type === 'assumption-expired')) {
        newCards.push({
          id: uuidv4(),
          type: 'assumption-expired',
          title: 'Assumption check',
          message: `Old assumption check for "${receipt.title}": are those assumptions still valid after ${Math.floor(age)} days?`,
          related_type: 'receipt',
          related_id: receipt.id,
          dismissed: false
        })
      }
    }
  })
  
  // Rule 5: Anniversary/milestone (optional - for receipts exactly 30, 90, 365 days old)
  receipts.forEach(receipt => {
    const age = Math.floor((now - new Date(receipt.created_at)) / (24 * 60 * 60 * 1000))
    const milestones = [30, 90, 365]
    
    milestones.forEach(milestone => {
      if (age >= milestone && age <= milestone + 2 && !dismissedIds.has(receipt.id)) {
        if (!existingCards.some(c => c.related_id === receipt.id && c.type === 'anniversary')) {
          newCards.push({
            id: uuidv4(),
            type: 'anniversary',
            title: `${milestone} days since`,
            message: `${milestone} days since "${receipt.title}". How does that decision look now?`,
            related_type: 'receipt',
            related_id: receipt.id,
            dismissed: false
          })
        }
      }
    })
  })
  
  return newCards
}

function findSilenceGap(items) {
  if (items.length === 0) return 999
  
  const now = new Date()
  const sorted = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const lastDate = new Date(sorted[0].created_at)
  
  return Math.floor((now - lastDate) / (24 * 60 * 60 * 1000))
}

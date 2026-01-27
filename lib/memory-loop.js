// Context Memory Loop (CML) Engine
// Closes the loop between decisions, outcomes, and learning

import { v4 as uuidv4 } from 'uuid'

// Minimum sample size for pattern detection
const MIN_SAMPLE_SIZE = 5

// Signal strength threshold for surfacing insights
const SIGNAL_THRESHOLD = 0.6

// Outcome labels for display
const OUTCOME_LABELS = {
  better: 'Better than expected',
  expected: 'As expected',
  worse: 'Worse than expected',
  unsure: 'Not sure yet',
  dismissed: 'Dismissed'
}

// Check if an outcome check is due for any receipts
export function findDueOutcomeChecks(receipts, existingOutcomes, settings = {}) {
  if (settings.outcome_checks_enabled === false) return []
  
  const delayDays = settings.outcome_delay_days || 7
  const now = new Date()
  const existingReceiptIds = new Set(existingOutcomes.map(o => o.receipt_id))
  
  const dueChecks = []
  
  for (const receipt of receipts) {
    // Skip if already has an outcome
    if (existingReceiptIds.has(receipt.id)) continue
    
    const receiptDate = new Date(receipt.created_at)
    const scheduledDate = new Date(receiptDate)
    scheduledDate.setDate(scheduledDate.getDate() + delayDays)
    
    // Check if it's time
    if (now >= scheduledDate) {
      dueChecks.push({
        receipt_id: receipt.id,
        receipt_title: receipt.title,
        receipt_decision_type: receipt.decision_type,
        receipt_confidence: receipt.confidence,
        receipt_emotions: receipt.emotions || [],
        receipt_created_at: receipt.created_at,
        scheduled_at: scheduledDate.toISOString(),
        days_since: Math.floor((now - receiptDate) / (1000 * 60 * 60 * 24))
      })
    }
  }
  
  // Return only ONE at a time (oldest first)
  return dueChecks.sort((a, b) => 
    new Date(a.scheduled_at) - new Date(b.scheduled_at)
  ).slice(0, 1)
}

// Create outcome check record
export function createOutcomeCheck(receipt, settings = {}) {
  const delayDays = settings.outcome_delay_days || 7
  const scheduledAt = new Date(receipt.created_at)
  scheduledAt.setDate(scheduledAt.getDate() + delayDays)
  
  return {
    id: uuidv4(),
    receipt_id: receipt.id,
    scheduled_at: scheduledAt.toISOString(),
    original_confidence: receipt.confidence,
    original_emotions: receipt.emotions || [],
    decision_type: receipt.decision_type,
    prompted: false,
    outcome: null,
    assumption_delta: null
  }
}

// Analyze patterns in outcomes
export function analyzeOutcomePatterns(outcomes, receipts) {
  const patterns = []
  
  // Filter completed outcomes (not dismissed, not unsure)
  const completedOutcomes = outcomes.filter(o => 
    o.outcome && !['dismissed', 'unsure'].includes(o.outcome) && o.completed_at
  )
  
  if (completedOutcomes.length < MIN_SAMPLE_SIZE) {
    return { patterns: [], insufficientData: true, sampleSize: completedOutcomes.length }
  }
  
  // Create a map of receipts for quick lookup
  const receiptMap = new Map(receipts.map(r => [r.id, r]))
  
  // Enrich outcomes with receipt data
  const enrichedOutcomes = completedOutcomes.map(o => ({
    ...o,
    receipt: receiptMap.get(o.receipt_id)
  })).filter(o => o.receipt)
  
  // 1. Emotion vs Outcome analysis
  const emotionPatterns = analyzeEmotionOutcome(enrichedOutcomes)
  patterns.push(...emotionPatterns)
  
  // 2. Confidence vs Outcome analysis
  const confidencePatterns = analyzeConfidenceOutcome(enrichedOutcomes)
  patterns.push(...confidencePatterns)
  
  // 3. Decision Type vs Outcome analysis
  const typePatterns = analyzeTypeOutcome(enrichedOutcomes)
  patterns.push(...typePatterns)
  
  return { 
    patterns: patterns.filter(p => p.signalStrength >= SIGNAL_THRESHOLD),
    insufficientData: false,
    sampleSize: completedOutcomes.length
  }
}

// Analyze emotion vs outcome correlation
function analyzeEmotionOutcome(outcomes) {
  const emotionStats = {}
  
  for (const outcome of outcomes) {
    const emotions = outcome.original_emotions || []
    for (const emotion of emotions) {
      if (!emotionStats[emotion]) {
        emotionStats[emotion] = { better: 0, expected: 0, worse: 0, total: 0 }
      }
      emotionStats[emotion][outcome.outcome]++
      emotionStats[emotion].total++
    }
  }
  
  const patterns = []
  
  for (const [emotion, stats] of Object.entries(emotionStats)) {
    if (stats.total < MIN_SAMPLE_SIZE) continue
    
    const worseRate = stats.worse / stats.total
    const betterRate = stats.better / stats.total
    
    // Check for significant worse outcome correlation
    if (worseRate >= 0.6) {
      patterns.push({
        type: 'emotion-outcome',
        key: `${emotion}-worse`,
        emotion,
        direction: 'worse',
        rate: worseRate,
        sampleSize: stats.total,
        signalStrength: worseRate,
        message: `Decisions made while feeling ${emotion} have gone worse than expected ${Math.round(worseRate * 100)}% of the time.`
      })
    }
    
    // Check for significant better outcome correlation
    if (betterRate >= 0.6) {
      patterns.push({
        type: 'emotion-outcome',
        key: `${emotion}-better`,
        emotion,
        direction: 'better',
        rate: betterRate,
        sampleSize: stats.total,
        signalStrength: betterRate,
        message: `Decisions made while feeling ${emotion} have gone better than expected ${Math.round(betterRate * 100)}% of the time.`
      })
    }
  }
  
  return patterns
}

// Analyze confidence vs outcome correlation
function analyzeConfidenceOutcome(outcomes) {
  const patterns = []
  
  // Group by confidence brackets
  const lowConfidence = outcomes.filter(o => o.original_confidence !== null && o.original_confidence <= 40)
  const highConfidence = outcomes.filter(o => o.original_confidence !== null && o.original_confidence >= 70)
  
  // Analyze low confidence outcomes
  if (lowConfidence.length >= MIN_SAMPLE_SIZE) {
    const worseCount = lowConfidence.filter(o => o.outcome === 'worse').length
    const betterCount = lowConfidence.filter(o => o.outcome === 'better').length
    const worseRate = worseCount / lowConfidence.length
    const betterRate = betterCount / lowConfidence.length
    
    if (worseRate >= 0.5) {
      patterns.push({
        type: 'confidence-outcome',
        key: 'low-confidence-worse',
        confidenceRange: 'low',
        direction: 'worse',
        rate: worseRate,
        sampleSize: lowConfidence.length,
        signalStrength: worseRate,
        message: `Low-confidence decisions have gone worse than expected ${Math.round(worseRate * 100)}% of the time.`
      })
    }
    
    // Interesting: low confidence but better outcomes
    if (betterRate >= 0.5) {
      patterns.push({
        type: 'confidence-outcome',
        key: 'low-confidence-better',
        confidenceRange: 'low',
        direction: 'better',
        rate: betterRate,
        sampleSize: lowConfidence.length,
        signalStrength: betterRate,
        message: `Low-confidence decisions have gone better than expected ${Math.round(betterRate * 100)}% of the time. Your doubts may be miscalibrated.`
      })
    }
  }
  
  // Analyze high confidence outcomes
  if (highConfidence.length >= MIN_SAMPLE_SIZE) {
    const worseCount = highConfidence.filter(o => o.outcome === 'worse').length
    const worseRate = worseCount / highConfidence.length
    
    if (worseRate >= 0.4) {
      patterns.push({
        type: 'confidence-outcome',
        key: 'high-confidence-worse',
        confidenceRange: 'high',
        direction: 'worse',
        rate: worseRate,
        sampleSize: highConfidence.length,
        signalStrength: worseRate + 0.1, // Boost signal for overconfidence
        message: `High-confidence decisions have gone worse than expected ${Math.round(worseRate * 100)}% of the time. There may be overconfidence at play.`
      })
    }
  }
  
  return patterns
}

// Analyze decision type vs outcome correlation
function analyzeTypeOutcome(outcomes) {
  const typeStats = {}
  
  for (const outcome of outcomes) {
    const type = outcome.decision_type
    if (!type) continue
    
    if (!typeStats[type]) {
      typeStats[type] = { better: 0, expected: 0, worse: 0, total: 0 }
    }
    typeStats[type][outcome.outcome]++
    typeStats[type].total++
  }
  
  const patterns = []
  
  for (const [type, stats] of Object.entries(typeStats)) {
    if (stats.total < MIN_SAMPLE_SIZE) continue
    
    const worseRate = stats.worse / stats.total
    const betterRate = stats.better / stats.total
    
    if (worseRate >= 0.6) {
      patterns.push({
        type: 'type-outcome',
        key: `${type}-worse`,
        decisionType: type,
        direction: 'worse',
        rate: worseRate,
        sampleSize: stats.total,
        signalStrength: worseRate,
        message: `${type} decisions have gone worse than expected ${Math.round(worseRate * 100)}% of the time.`
      })
    }
    
    if (betterRate >= 0.6) {
      patterns.push({
        type: 'type-outcome',
        key: `${type}-better`,
        decisionType: type,
        direction: 'better',
        rate: betterRate,
        sampleSize: stats.total,
        signalStrength: betterRate,
        message: `${type} decisions have gone better than expected ${Math.round(betterRate * 100)}% of the time.`
      })
    }
  }
  
  return patterns
}

// Generate "One thing learned this week" from outcomes
export function generateWeeklyLearning(outcomes, weekStart, weekEnd) {
  const weekOutcomes = outcomes.filter(o => {
    if (!o.completed_at) return false
    const completedDate = new Date(o.completed_at)
    return completedDate >= weekStart && completedDate <= weekEnd
  })
  
  if (weekOutcomes.length === 0) {
    return {
      learning: null,
      outcomesCount: 0,
      hasDeltas: false
    }
  }
  
  // Collect assumption deltas
  const deltas = weekOutcomes
    .filter(o => o.assumption_delta && o.assumption_delta.trim())
    .map(o => o.assumption_delta)
  
  // Count outcomes by type
  const outcomeCounts = {
    better: weekOutcomes.filter(o => o.outcome === 'better').length,
    expected: weekOutcomes.filter(o => o.outcome === 'expected').length,
    worse: weekOutcomes.filter(o => o.outcome === 'worse').length
  }
  
  // Generate learning statement
  let learning = null
  
  if (deltas.length > 0) {
    // If there are assumption deltas, use the most recent one as a learning prompt
    learning = `From a recent decision: "${deltas[deltas.length - 1]}"`
  } else if (outcomeCounts.worse > outcomeCounts.better) {
    learning = `${outcomeCounts.worse} decision(s) went worse than expected this week. What was different from what you assumed?`
  } else if (outcomeCounts.better > outcomeCounts.worse) {
    learning = `${outcomeCounts.better} decision(s) went better than expected. What worked that you didn't anticipate?`
  } else if (weekOutcomes.length > 0) {
    learning = `${weekOutcomes.length} decision outcome(s) recorded this week.`
  }
  
  return {
    learning,
    outcomesCount: weekOutcomes.length,
    hasDeltas: deltas.length > 0,
    outcomeCounts
  }
}

// Create insight event from pattern
export function createInsightEvent(pattern, userId) {
  return {
    id: uuidv4(),
    user_id: userId,
    insight_type: pattern.type,
    pattern_key: pattern.key,
    pattern_data: {
      direction: pattern.direction,
      rate: pattern.rate,
      emotion: pattern.emotion,
      decisionType: pattern.decisionType,
      confidenceRange: pattern.confidenceRange
    },
    sample_size: pattern.sampleSize,
    signal_strength: pattern.signalStrength,
    message: pattern.message,
    surfaced: false,
    dismissed: false
  }
}

// Check if insight should be surfaced (not already shown)
export function shouldSurfaceInsight(pattern, existingInsights) {
  // Check if this pattern was already surfaced
  const existing = existingInsights.find(i => 
    i.pattern_key === pattern.key && 
    (i.surfaced || i.dismissed)
  )
  
  return !existing
}

// Get the single most important unsurfaced insight
export function getTopInsight(patterns, existingInsights) {
  const newPatterns = patterns.filter(p => shouldSurfaceInsight(p, existingInsights))
  
  if (newPatterns.length === 0) return null
  
  // Sort by signal strength and return top one
  return newPatterns.sort((a, b) => b.signalStrength - a.signalStrength)[0]
}

export { OUTCOME_LABELS, MIN_SAMPLE_SIZE, SIGNAL_THRESHOLD }

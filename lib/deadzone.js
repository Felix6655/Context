// DeadZone Heuristics - Detect stale zones in user's life
// No ML/AI - just simple pattern detection

export function computeDeadZoneFlags(receipts, moments, windowDays = 14) {
  const flags = []
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)
  
  // Filter items within window
  const recentReceipts = receipts.filter(r => new Date(r.created_at) >= windowStart)
  const recentMoments = moments.filter(m => new Date(m.created_at) >= windowStart)
  
  const totalItems = recentReceipts.length + recentMoments.length
  
  // Flag 1: Low signal - less than 2 items in window
  if (totalItems < 2) {
    flags.push({
      type: 'low-signal',
      severity: 'high',
      title: 'Low Signal Zone',
      message: `Only ${totalItems} entries in the last ${windowDays} days. Your context is fading.`
    })
  }
  
  // Flag 2: Silence gap - 5+ consecutive days without entries
  const silenceGap = findLongestSilenceGap([...recentReceipts, ...recentMoments], windowDays)
  if (silenceGap >= 5) {
    flags.push({
      type: 'silence-gap',
      severity: silenceGap >= 7 ? 'high' : 'medium',
      title: 'Silence Gap Detected',
      message: `${silenceGap} days without any entries. What's been happening?`,
      gapDays: silenceGap
    })
  }
  
  // Flag 3: Single category lock - >70% moments in one category
  if (recentMoments.length >= 3) {
    const categoryLock = detectCategoryLock(recentMoments)
    if (categoryLock) {
      flags.push({
        type: 'category-lock',
        severity: 'medium',
        title: 'Single Focus Zone',
        message: `${categoryLock.percentage}% of your moments are about ${categoryLock.category}. Life might be narrowing.`,
        category: categoryLock.category,
        percentage: categoryLock.percentage
      })
    }
  }
  
  // Flag 4: Repeated tags pattern
  const allTags = [
    ...recentReceipts.flatMap(r => r.tags || []),
    ...recentMoments.flatMap(m => m.tags || [])
  ]
  const tagRepetition = detectTagRepetition(allTags)
  if (tagRepetition) {
    flags.push({
      type: 'tag-repetition',
      severity: 'low',
      title: 'Pattern Detected',
      message: `"${tagRepetition.tag}" appears frequently. Is this a rut or a rhythm?`,
      tag: tagRepetition.tag,
      count: tagRepetition.count
    })
  }
  
  // Flag 5: No receipts but many moments (avoiding decisions)
  if (recentMoments.length >= 5 && recentReceipts.length === 0) {
    flags.push({
      type: 'decision-avoidance',
      severity: 'medium',
      title: 'Decision Drought',
      message: 'Lots of moments captured, but no decisions logged. Are you avoiding something?'
    })
  }
  
  // Summary stats
  const summary = {
    windowDays,
    totalReceipts: recentReceipts.length,
    totalMoments: recentMoments.length,
    totalItems,
    silenceGapDays: silenceGap,
    uniqueTags: [...new Set(allTags)].length,
    flagCount: flags.length,
    lastActivity: getLastActivityDate([...recentReceipts, ...recentMoments])
  }
  
  return { flags, summary }
}

function findLongestSilenceGap(items, windowDays) {
  if (items.length === 0) return windowDays
  
  const now = new Date()
  const dates = items.map(i => new Date(i.created_at).toDateString())
  const uniqueDates = [...new Set(dates)].map(d => new Date(d)).sort((a, b) => a - b)
  
  let maxGap = 0
  
  // Check gap from window start to first entry
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)
  if (uniqueDates.length > 0) {
    const firstGap = Math.floor((uniqueDates[0] - windowStart) / (24 * 60 * 60 * 1000))
    maxGap = Math.max(maxGap, firstGap)
  }
  
  // Check gaps between entries
  for (let i = 1; i < uniqueDates.length; i++) {
    const gap = Math.floor((uniqueDates[i] - uniqueDates[i - 1]) / (24 * 60 * 60 * 1000))
    maxGap = Math.max(maxGap, gap)
  }
  
  // Check gap from last entry to now
  if (uniqueDates.length > 0) {
    const lastGap = Math.floor((now - uniqueDates[uniqueDates.length - 1]) / (24 * 60 * 60 * 1000))
    maxGap = Math.max(maxGap, lastGap)
  }
  
  return maxGap
}

function detectCategoryLock(moments) {
  const categoryCounts = {}
  moments.forEach(m => {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1
  })
  
  const total = moments.length
  for (const [category, count] of Object.entries(categoryCounts)) {
    const percentage = Math.round((count / total) * 100)
    if (percentage > 70) {
      return { category, percentage, count }
    }
  }
  return null
}

function detectTagRepetition(tags) {
  if (tags.length < 3) return null
  
  const tagCounts = {}
  tags.forEach(t => {
    tagCounts[t] = (tagCounts[t] || 0) + 1
  })
  
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
  if (sorted.length > 0 && sorted[0][1] >= 3) {
    return { tag: sorted[0][0], count: sorted[0][1] }
  }
  return null
}

function getLastActivityDate(items) {
  if (items.length === 0) return null
  const sorted = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return sorted[0].created_at
}

// Demo data for non-authenticated users

export const demoReceipts = [
  {
    id: 'demo-receipt-1',
    user_id: 'demo',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Accepted the remote position',
    decision_type: 'Career',
    context: 'After 3 years of commuting, the remote offer came with a 15% pay cut but full flexibility. Kids are young, partner works hybrid.',
    assumptions: 'Assuming remote work culture will remain.\nAssuming I can maintain productivity without office structure.',
    constraints: 'Need to decide by Friday.\nCannot negotiate the salary further.',
    emotions: ['excited', 'anxious', 'uncertain'],
    confidence: 65,
    change_mind: 'If they mandate return-to-office within 12 months, or if I feel isolated.',
    tags: ['work', 'family', 'flexibility'],
    link_url: null,
    location_label: 'Home office'
  },
  {
    id: 'demo-receipt-2',
    user_id: 'demo',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Sold the investment property',
    decision_type: 'Money',
    context: 'Market peaked, maintenance costs rising, tenant issues. Used proceeds for index funds.',
    assumptions: 'Real estate growth will slow.\nStock market will recover long-term.',
    constraints: 'Capital gains tax deadline.\nEmotional attachment to first investment.',
    emotions: ['calm', 'uncertain'],
    confidence: 45,
    change_mind: 'If property values continue climbing 15%+ annually.',
    tags: ['investment', 'real-estate', 'financial-planning'],
    link_url: null,
    location_label: null
  },
  {
    id: 'demo-receipt-3',
    user_id: 'demo',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Started weekly therapy sessions',
    decision_type: 'Health',
    context: 'Burnout symptoms, trouble sleeping, partner suggested it. Found a therapist who specializes in work stress.',
    assumptions: 'Insurance will continue covering sessions.\nI will commit to the process.',
    constraints: 'Budget: $80/week after insurance.\nTime: Thursday evenings only.',
    emotions: ['pressured', 'hopeful'],
    confidence: 70,
    change_mind: 'If after 3 months I see no improvement.',
    tags: ['health', 'mental-health', 'self-care'],
    link_url: null,
    location_label: 'Virtual'
  }
]

export const demoMoments = [
  {
    id: 'demo-moment-1',
    user_id: 'demo',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Last soccer practice of the season',
    category: 'Family',
    note: 'Watched Emma score her first goal. She ran to me first.',
    why_mattered: 'These Saturday mornings will end someday. She\'s growing so fast.',
    tags: ['kids', 'sports', 'memories']
  },
  {
    id: 'demo-moment-2',
    user_id: 'demo',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Coffee with Marcus',
    category: 'People',
    note: 'Old colleague, now at a startup. We used to complain about the same things.',
    why_mattered: 'Realized how much has changed. Our paths diverged but the conversation felt the same.',
    tags: ['friends', 'nostalgia']
  },
  {
    id: 'demo-moment-3',
    user_id: 'demo',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Morning run at the lake',
    category: 'Routine',
    note: 'Fog lifting, nobody else there. Just me and the geese.',
    why_mattered: 'This route might not be here next year. New development planned.',
    tags: ['exercise', 'nature', 'solitude']
  },
  {
    id: 'demo-moment-4',
    user_id: 'demo',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Late night debugging session',
    category: 'Work',
    note: 'Fixed the bug that haunted us for weeks. Team celebrated in Slack.',
    why_mattered: 'Small wins matter. The code will be forgotten, but this feeling won\'t.',
    tags: ['work', 'accomplishment']
  },
  {
    id: 'demo-moment-5',
    user_id: 'demo',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Parents visiting for dinner',
    category: 'Family',
    note: 'Dad taught the kids his card trick. Mom made her famous pasta.',
    why_mattered: 'They\'re getting older. These visits feel more precious each time.',
    tags: ['family', 'parents', 'gratitude']
  }
]

export const demoPerspectiveCards = [
  {
    id: 'demo-card-1',
    user_id: 'demo',
    created_at: new Date().toISOString(),
    type: 'low-confidence',
    title: 'Uncertain decision revisit',
    message: 'You made a low-confidence decision "Sold the investment property" 15 days ago. Is the original context still true?',
    related_type: 'receipt',
    related_id: 'demo-receipt-2',
    dismissed: false
  },
  {
    id: 'demo-card-2',
    user_id: 'demo',
    created_at: new Date().toISOString(),
    type: 'category-lock',
    title: 'Living inside Family',
    message: "You've been living inside Family. If this is one of the last weeks like this, what matters most?",
    related_type: null,
    related_id: null,
    dismissed: false
  }
]

export const demoDeadZone = {
  flags: [
    {
      type: 'silence-gap',
      severity: 'medium',
      title: 'Silence Gap Detected',
      message: '5 days without any entries. What\'s been happening?',
      gapDays: 5
    }
  ],
  summary: {
    windowDays: 14,
    totalReceipts: 1,
    totalMoments: 5,
    totalItems: 6,
    silenceGapDays: 5,
    uniqueTags: 8,
    flagCount: 1
  }
}

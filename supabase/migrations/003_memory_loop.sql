-- Context Memory Loop (CML) Schema
-- Closes the loop between decisions, outcomes, and learning

-- Decision outcomes storage
CREATE TABLE IF NOT EXISTS decision_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('better', 'expected', 'worse', 'unsure', 'dismissed')),
  assumption_delta TEXT,
  original_confidence INTEGER,
  original_emotions TEXT[],
  decision_type TEXT,
  prompted BOOLEAN DEFAULT FALSE,
  prompted_at TIMESTAMPTZ,
  UNIQUE(receipt_id)
);

-- Insight events (pattern triggers)
CREATE TABLE IF NOT EXISTS insight_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('emotion-outcome', 'confidence-outcome', 'type-outcome', 'assumption-pattern')),
  pattern_key TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  sample_size INTEGER NOT NULL,
  signal_strength DECIMAL(3,2) CHECK (signal_strength >= 0 AND signal_strength <= 1),
  message TEXT NOT NULL,
  surfaced BOOLEAN DEFAULT FALSE,
  surfaced_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ
);

-- Add CML settings to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS outcome_checks_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS outcome_delay_days INTEGER DEFAULT 7 CHECK (outcome_delay_days >= 3 AND outcome_delay_days <= 30),
  ADD COLUMN IF NOT EXISTS insights_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_outcome_check_at TIMESTAMPTZ;

-- Add learned_this_week to weekly_reflections
ALTER TABLE weekly_reflections
  ADD COLUMN IF NOT EXISTS learned_this_week TEXT,
  ADD COLUMN IF NOT EXISTS auto_generated_learning TEXT,
  ADD COLUMN IF NOT EXISTS outcomes_included INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE decision_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for decision_outcomes
DROP POLICY IF EXISTS "Users can view own decision outcomes" ON decision_outcomes;
CREATE POLICY "Users can view own decision outcomes" ON decision_outcomes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own decision outcomes" ON decision_outcomes;
CREATE POLICY "Users can insert own decision outcomes" ON decision_outcomes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own decision outcomes" ON decision_outcomes;
CREATE POLICY "Users can update own decision outcomes" ON decision_outcomes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own decision outcomes" ON decision_outcomes;
CREATE POLICY "Users can delete own decision outcomes" ON decision_outcomes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for insight_events
DROP POLICY IF EXISTS "Users can view own insights" ON insight_events;
CREATE POLICY "Users can view own insights" ON insight_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own insights" ON insight_events;
CREATE POLICY "Users can insert own insights" ON insight_events FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own insights" ON insight_events;
CREATE POLICY "Users can update own insights" ON insight_events FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own insights" ON insight_events;
CREATE POLICY "Users can delete own insights" ON insight_events FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_decision_outcomes_user_id ON decision_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_outcomes_receipt_id ON decision_outcomes(receipt_id);
CREATE INDEX IF NOT EXISTS idx_decision_outcomes_scheduled ON decision_outcomes(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_decision_outcomes_outcome ON decision_outcomes(outcome);
CREATE INDEX IF NOT EXISTS idx_insight_events_user_id ON insight_events(user_id);
CREATE INDEX IF NOT EXISTS idx_insight_events_type ON insight_events(insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_events_surfaced ON insight_events(surfaced);

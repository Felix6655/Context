-- Context Reflection Engine Schema
-- Additional tables for the reflection system

-- Weekly reflections storage
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}',
  reflection_question TEXT,
  suggested_action TEXT,
  tone TEXT DEFAULT 'gentle' CHECK (tone IN ('neutral', 'gentle', 'direct')),
  user_notes TEXT,
  viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ
);

-- Notification events tracking
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('silence-nudge', 'weekly-reflection-ready', 'capture-reminder', 'perspective-card')),
  title TEXT NOT NULL,
  message TEXT,
  priority TEXT DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Add reflection settings to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS weekly_reflections_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS silence_nudges_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS capture_reminders_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reflection_day INTEGER DEFAULT 0 CHECK (reflection_day >= 0 AND reflection_day <= 6),
  ADD COLUMN IF NOT EXISTS reflection_hour INTEGER DEFAULT 18 CHECK (reflection_hour >= 0 AND reflection_hour <= 23),
  ADD COLUMN IF NOT EXISTS reflection_tone TEXT DEFAULT 'gentle' CHECK (reflection_tone IN ('neutral', 'gentle', 'direct')),
  ADD COLUMN IF NOT EXISTS silence_threshold_days INTEGER DEFAULT 5 CHECK (silence_threshold_days >= 1 AND silence_threshold_days <= 30),
  ADD COLUMN IF NOT EXISTS last_silence_prompt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_weekly_reflection_at TIMESTAMPTZ;

-- Enable RLS on new tables
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_reflections
DROP POLICY IF EXISTS "Users can view own weekly reflections" ON weekly_reflections;
CREATE POLICY "Users can view own weekly reflections" ON weekly_reflections FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own weekly reflections" ON weekly_reflections;
CREATE POLICY "Users can insert own weekly reflections" ON weekly_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own weekly reflections" ON weekly_reflections;
CREATE POLICY "Users can update own weekly reflections" ON weekly_reflections FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own weekly reflections" ON weekly_reflections;
CREATE POLICY "Users can delete own weekly reflections" ON weekly_reflections FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_events
DROP POLICY IF EXISTS "Users can view own notifications" ON notification_events;
CREATE POLICY "Users can view own notifications" ON notification_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON notification_events;
CREATE POLICY "Users can insert own notifications" ON notification_events FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON notification_events;
CREATE POLICY "Users can update own notifications" ON notification_events FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own notifications" ON notification_events;
CREATE POLICY "Users can delete own notifications" ON notification_events FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_id ON weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_period ON weekly_reflections(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_user_id ON notification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_type ON notification_events(type);
CREATE INDEX IF NOT EXISTS idx_notification_events_read ON notification_events(read);
CREATE INDEX IF NOT EXISTS idx_notification_events_dismissed ON notification_events(dismissed);

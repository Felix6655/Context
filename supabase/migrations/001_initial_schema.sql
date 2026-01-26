-- Context App Database Schema
-- Run this SQL in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  perspective_intensity TEXT DEFAULT 'medium' CHECK (perspective_intensity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts table (decision logging)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('Career', 'Money', 'Relationship', 'Health', 'Project', 'Other')),
  context TEXT,
  assumptions TEXT,
  constraints TEXT,
  emotions TEXT[] DEFAULT '{}',
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  change_mind TEXT,
  tags TEXT[] DEFAULT '{}',
  link_url TEXT,
  location_label TEXT
);

-- Moments table (lightweight memory logging)
CREATE TABLE IF NOT EXISTS moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('People', 'Place', 'Routine', 'Work', 'Family', 'Other')),
  note TEXT,
  why_mattered TEXT,
  tags TEXT[] DEFAULT '{}'
);

-- DeadZone snapshots (staleness detection)
CREATE TABLE IF NOT EXISTS deadzone_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  window_days INTEGER DEFAULT 14,
  summary JSONB DEFAULT '{}',
  flags JSONB DEFAULT '[]'
);

-- Perspective cards (One Last Time prompts)
CREATE TABLE IF NOT EXISTS perspective_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('deadzone', 'anniversary', 'gap', 'assumption-expired', 'low-confidence', 'category-lock')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_type TEXT CHECK (related_type IN ('receipt', 'moment', NULL)),
  related_id UUID,
  dismissed BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadzone_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE perspective_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for receipts
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
CREATE POLICY "Users can view own receipts" ON receipts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own receipts" ON receipts;
CREATE POLICY "Users can insert own receipts" ON receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
CREATE POLICY "Users can update own receipts" ON receipts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own receipts" ON receipts;
CREATE POLICY "Users can delete own receipts" ON receipts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for moments
DROP POLICY IF EXISTS "Users can view own moments" ON moments;
CREATE POLICY "Users can view own moments" ON moments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own moments" ON moments;
CREATE POLICY "Users can insert own moments" ON moments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own moments" ON moments;
CREATE POLICY "Users can update own moments" ON moments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own moments" ON moments;
CREATE POLICY "Users can delete own moments" ON moments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for deadzone_snapshots
DROP POLICY IF EXISTS "Users can view own deadzone snapshots" ON deadzone_snapshots;
CREATE POLICY "Users can view own deadzone snapshots" ON deadzone_snapshots FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own deadzone snapshots" ON deadzone_snapshots;
CREATE POLICY "Users can insert own deadzone snapshots" ON deadzone_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own deadzone snapshots" ON deadzone_snapshots;
CREATE POLICY "Users can delete own deadzone snapshots" ON deadzone_snapshots FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for perspective_cards
DROP POLICY IF EXISTS "Users can view own perspective cards" ON perspective_cards;
CREATE POLICY "Users can view own perspective cards" ON perspective_cards FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own perspective cards" ON perspective_cards;
CREATE POLICY "Users can insert own perspective cards" ON perspective_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own perspective cards" ON perspective_cards;
CREATE POLICY "Users can update own perspective cards" ON perspective_cards FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own perspective cards" ON perspective_cards;
CREATE POLICY "Users can delete own perspective cards" ON perspective_cards FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_user_id ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deadzone_user_id ON deadzone_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_perspective_user_id ON perspective_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_perspective_dismissed ON perspective_cards(dismissed);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to receipts
DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

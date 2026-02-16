-- Phase 15: Database Schema Updates
-- Part 1: Simplified Project Schema & Worker Matching
-- All changes are NON-BREAKING and additive

-- ============================================
-- 1. Add skill field to profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS skill TEXT CHECK (skill IN ('graphics', 'web', 'printing'));

-- Update existing workers based on role
UPDATE profiles 
SET skill = CASE 
    WHEN role = 'graphic_designer' THEN 'graphics'
    WHEN role = 'web_designer' THEN 'web'
    ELSE NULL
END
WHERE role IN ('graphic_designer', 'web_designer', 'worker') AND skill IS NULL;

-- ============================================
-- 2. Add simplified project fields
-- ============================================

-- Urgency field (normal/priority)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'priority'));

-- Project type for web design (prototype/full_website)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS project_type TEXT CHECK (project_type IN ('prototype', 'full_website'));

-- Item field for printing (t-shirt, mug, etc.)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS item TEXT;

-- Quantity field for printing
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS quantity INTEGER;

-- ============================================
-- 3. Create worker_rotation table
-- ============================================
CREATE TABLE IF NOT EXISTS worker_rotation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill TEXT NOT NULL CHECK (skill IN ('graphics', 'web', 'printing')),
    worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    last_assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assignment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_worker_rotation_skill ON worker_rotation(skill);
CREATE INDEX IF NOT EXISTS idx_worker_rotation_last_assigned ON worker_rotation(last_assigned_at);

-- ============================================
-- 4. Create portfolio table
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    ai_polished_description TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_worker ON portfolio(worker_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_service ON portfolio(service_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio(is_featured);

-- ============================================
-- 5. Create exchange_rates table
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_currency, to_currency)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);

-- ============================================
-- 6. Add conversation_id to projects
-- ============================================
-- Note: conversations table will be created separately
-- This is just a UUID field to link projects to conversations
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- ============================================
-- 7. Add final_file to projects
-- ============================================
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS final_file TEXT;

COMMENT ON TABLE worker_rotation IS 'Tracks worker assignment rotation for fair distribution';
COMMENT ON TABLE portfolio IS 'Stores approved project work for public portfolio display';
COMMENT ON TABLE exchange_rates IS 'Caches currency exchange rates (updated every 12-24 hours)';

-- 1. Create Portfolio Table
CREATE TABLE IF NOT EXISTS portfolio (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT, -- URL to the primary cover image
    images TEXT[] -- Array of URLs for the gallery
);

-- 2. Create Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    role TEXT,
    review TEXT NOT NULL,
    stars INTEGER DEFAULT 5,
    published BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0
);

-- 3. Create Security Logs Table
CREATE TABLE IF NOT EXISTS security_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL, -- 'login_fail', 'api_fail', 'upload_accept', 'upload_reject'
    details JSONB DEFAULT '{}'::jsonb
);

-- 4. Enable Row Level Security (RLS)
-- Note: By default, tables are restricted. You will need to add policies 
-- in the Supabase Dashboard to allow public read access.

-- Example Policy for Public Read:
-- PORTFOLIO:
-- ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public Access" ON portfolio FOR SELECT USING (true);

-- TESTIMONIALS:
-- ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public Access" ON testimonials FOR SELECT USING (true);

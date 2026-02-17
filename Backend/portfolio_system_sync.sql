-- PORTFOLIO SYSTEM SYNCHRONIZATION (V2)
-- Unifies naming between frontend (singular 'portfolio') and backend.

-- 1. Create or Rename Table
DO $$ 
BEGIN
    -- If portfolio_items exists but portfolio does not, rename it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolio_items') 
    AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolio') THEN
        ALTER TABLE public.portfolio_items RENAME TO portfolio;
    END IF;
END $$;

-- 2. Ensure the table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    ai_polished_description TEXT,
    image_url TEXT NOT NULL,
    service_type TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    uploaded_by_role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Column Migration/Ensurance
-- Ensure all columns exist even if we renamed an old table
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS ai_polished_description TEXT;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS uploaded_by_role TEXT;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- If 'category' exists but not 'service_type', migrate it
DO $$ BEGIN
    IF EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='portfolio' AND column_name='category') THEN
        UPDATE public.portfolio SET service_type = category WHERE service_type IS NULL;
    END IF;
END $$;

-- If 'image' exists but not 'image_url', migrate it
DO $$ BEGIN
    IF EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='portfolio' AND column_name='image') THEN
        UPDATE public.portfolio SET image_url = image WHERE image_url IS NULL;
    END IF;
END $$;

-- 4. RLS POLICIES
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public portfolio viewing" ON public.portfolio;
CREATE POLICY "Public portfolio viewing" ON public.portfolio
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Workers can manage their own portfolio" ON public.portfolio;
CREATE POLICY "Workers can manage their own portfolio" ON public.portfolio
    FOR ALL USING (
        auth.uid() = worker_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. SEED MOCK DATA (High quality examples)
-- First, get an admin or worker ID for attribution if possible, otherwise use a generic UUID
INSERT INTO public.portfolio (title, description, image_url, service_type, is_featured, is_approved) VALUES
('Plaiz Brand Identity', 'A complete rebranding project including logo design, color palette, and brand guidelines.', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=2000', 'graphics', true, true),
('Eco-Commerce Platform', 'A sustainable fashion e-commerce site with integrated carbon tracking.', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=2000', 'web', true, true),
('Elite Business Suits', 'Premium business card and stationery design for a law firm.', 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&q=80&w=2000', 'printing', false, true),
('Vanguard Mobile App', 'Fintech dashboard design focusing on clarity and ease of use.', 'https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=2000', 'web', true, true),
('Urban Catalyst', 'Event poster series for a city-wide art festival.', 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80&w=2000', 'graphics', false, true);

-- Update attribution if profiles exist
UPDATE public.portfolio SET worker_id = (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1) WHERE worker_id IS NULL;

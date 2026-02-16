-- PHASE 1: UNIFIED SYSTEM SCHEMA & RLS

-- 1. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('client', 'graphic_designer', 'web_designer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status_enum AS ENUM ('pending', 'in_progress', 'review', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_type_enum AS ENUM ('graphic_design', 'web_design');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- PROFILES: Stores user identity and role info
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role_enum DEFAULT 'client'::user_role_enum,
    specialization TEXT, -- e.g. "Logo Design", "React Dev"
    is_online BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- PROJECTS: Project-based collaboration
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status project_status_enum DEFAULT 'pending'::project_status_enum NOT NULL,
    project_type project_type_enum DEFAULT 'graphic_design'::project_type_enum NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- MESSAGES: Real-time project-based chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    content TEXT,
    attachment_url TEXT,
    attachment_type TEXT, -- 'image', 'video', 'document', 'audio'
    attachment_name TEXT,
    is_voice_note BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- PORTFOLIO: Public work gallery
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    client_name TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- PROJECTS
CREATE POLICY "Admins can view all projects" ON public.projects
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Clients can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Workers can view assigned projects" ON public.projects
    FOR SELECT USING (auth.uid() = worker_id);

-- MESSAGES (WhatsApp-style Chat Rules)
CREATE POLICY "Admins can view all messages" ON public.messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Project participants can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id 
            AND (client_id = auth.uid() OR worker_id = auth.uid())
        )
    );

CREATE POLICY "Project participants can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
            EXISTS (
                SELECT 1 FROM public.projects 
                WHERE id = project_id 
                AND (client_id = auth.uid() OR worker_id = auth.uid())
            )
        )
    );

-- PORTFOLIO
CREATE POLICY "Portfolio items are public for viewing" ON public.portfolio_items
    FOR SELECT USING (true);

CREATE POLICY "Workers and Admins can manage portfolio" ON public.portfolio_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'graphic_designer', 'web_designer')
        )
    );

-- 5. FUNCTIONAL HELPERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role user_role_enum;
    meta_role TEXT;
    meta_spec TEXT;
BEGIN
    meta_role := NEW.raw_user_meta_data->>'role';
    meta_spec := NEW.raw_user_meta_data->>'specialization';

    -- Logic to determine proper enum role
    IF meta_role = 'worker' THEN
        IF meta_spec = 'web_design' THEN
            target_role := 'web_designer';
        ELSE
            target_role := 'graphic_designer'; -- Default for other specs
        END IF;
    ELSIF meta_role = 'admin' THEN
        target_role := 'admin';
    ELSE
        target_role := 'client';
    END IF;

    INSERT INTO public.profiles (id, full_name, avatar_url, role, specialization)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'avatar_url', 
        target_role,
        meta_spec -- Also save specialization string
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Create or Update Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create User Roles Table
CREATE TYPE user_role_enum AS ENUM ('client', 'graphic_designer', 'web_designer', 'admin');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'client',
  UNIQUE(user_id)
);

-- 3. Create or Update Projects Table
CREATE TYPE project_status_enum AS ENUM ('pending', 'in_progress', 'review', 'completed', 'cancelled');
CREATE TYPE project_type_enum AS ENUM ('graphic_design', 'web_design');

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES auth.users ON DELETE SET NULL,
  worker_id uuid REFERENCES auth.users ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status project_status_enum NOT NULL DEFAULT 'pending',
  project_type project_type_enum NOT NULL DEFAULT 'graphic_design',
  category text, -- For backward compatibility
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Roles
CREATE POLICY "User roles are viewable by everyone." ON public.user_roles
  FOR SELECT USING (true);

-- Projects
CREATE POLICY "Clients can view their own projects." ON public.projects
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

CREATE POLICY "Workers can view projects in their category." ON public.projects
  FOR SELECT USING (
    auth.uid() = worker_id OR 
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin') OR
    (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('graphic_designer', 'web_designer')) AND project_type::text = (SELECT specialization FROM profiles WHERE id = auth.uid()))
  );

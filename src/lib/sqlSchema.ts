export const DOCUFLOW_SUPABASE_SQL = `-- DocuFlow Complete Supabase Schema Setup Script

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Document',
  content text DEFAULT '',
  category text DEFAULT 'Personal',
  is_starred boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  user_email text,
  cover_image text,
  icon text DEFAULT '📄',
  access_level text DEFAULT 'private',
  word_count int DEFAULT 0,
  char_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON public.documents(updated_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies for Profiles
CREATE POLICY "authenticated users can SELECT their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "authenticated users can INSERT their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "authenticated users can UPDATE their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. Strict RLS Policies for Documents
CREATE POLICY "authenticated users can SELECT their own documents" 
ON public.documents FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "authenticated users can INSERT documents where user_id = auth.uid()" 
ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated users can UPDATE their own documents" 
ON public.documents FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "authenticated users can DELETE their own documents" 
ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- 7. Flush Schema Cache & Enable Realtime
NOTIFY pgrst, 'reload schema';
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
`;

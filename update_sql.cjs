const fs = require('fs');

const sql = `-- DocuFlow Complete Supabase Schema Setup Script
-- Paste and run this script in your Supabase SQL Editor (https://app.supabase.com)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'Personal',
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  user_email TEXT,
  cover_image TEXT,
  icon TEXT DEFAULT '📄',
  access_level TEXT DEFAULT 'private',
  word_count INT DEFAULT 0,
  char_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- 7. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
`;

let code = `export const DOCUFLOW_SUPABASE_SQL = \`\n${"$"}{sql}\n\`;\n`;
fs.writeFileSync('src/lib/sqlSchema.ts', code);

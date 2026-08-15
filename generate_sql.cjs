const fs = require('fs');
const sql = `-- DocuFlow Complete Supabase Schema Setup Script
-- Paste and run this script in your Supabase SQL Editor (https://app.supabase.com)

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '<p>Start typing your document here...</p>',
  category TEXT DEFAULT 'general',
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

-- 3. Create Document Permissions/Shares Table
CREATE TABLE IF NOT EXISTS public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'comment'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  highlighted_text TEXT,
  text TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Document Versions Table
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- 7. Permissive Policies for DocuFlow Apps

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Documents
CREATE POLICY "Allow document owners full access" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow access to shared or public docs" ON public.documents FOR SELECT USING (
  auth.uid() = user_id OR 
  access_level IN ('shared', 'public_read', 'public_edit')
);
CREATE POLICY "Allow edit to public_edit docs" ON public.documents FOR UPDATE USING (
  access_level = 'public_edit'
);

-- Comments
CREATE POLICY "Allow all on comments" ON public.comments FOR ALL USING (true);

-- Document Shares
CREATE POLICY "Allow all on document_shares" ON public.document_shares FOR ALL USING (true);

-- Document Versions
CREATE POLICY "Allow all on document_versions" ON public.document_versions FOR ALL USING (true);

-- 8. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
`;
fs.writeFileSync('src/lib/sqlSchema.ts', `export const DOCUFLOW_SUPABASE_SQL = \`\n${sql}\n\`;\n`);

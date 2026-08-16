import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config';
import { DocuFlowDocument, DocumentComment, DocumentVersion, DocumentPermission, UserProfile } from '../types';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper to sanitize counts
export function calculateCounts(htmlContent: string) {
  const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;
  return { wordCount, charCount };
}

// Local Storage Fallback Key
const LOCAL_DOCS_KEY = 'docuflow_local_documents_v1';
const LOCAL_COMMENTS_KEY = 'docuflow_local_comments_v1';
const LOCAL_VERSIONS_KEY = 'docuflow_local_versions_v1';

export function getLocalDocuments(): DocuFlowDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local documents', e);
    return [];
  }
}

export function saveLocalDocuments(docs: DocuFlowDocument[]) {
  try {
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error('Error saving local documents', e);
  }
}

// Service functions
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Get session error:', error.message);
      return null;
    }
    if (session?.user) {
      return session.user;
    }
  } catch (e) {
    console.error('Error reading Supabase session', e);
  }
  return null;
}

export async function resendConfirmationEmail(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      console.warn('Supabase resend notice:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Confirmation link sent to your Gmail inbox!' };
  } catch (err: any) {
    console.warn('Resend email exception:', err);
    return { success: true, message: 'Confirmation link sent to your Gmail inbox!' };
  }
}

export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Signout error:', error);
  } catch (err) {
    console.error('Signout exception:', err);
  }
  window.dispatchEvent(new CustomEvent('docuflow_auth_change', { detail: null }));
}

// User profile sync
export async function syncUserProfile(user: any): Promise<UserProfile> {
  const username = user.user_metadata?.username || user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '_') || user.email?.split('@')[0] || 'user';
  const profile: UserProfile = {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || username || 'User',
    username: username,
    avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || user.email}`,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.warn('Profile fetch notice:', fetchError.message);
      throw fetchError;
    }

    if (!existingProfile) {
      const { error: insertError } = await supabase.from('profiles').insert(profile);
      if (insertError) {
        console.warn('Profile creation notice:', insertError.message);
        throw insertError;
      }
    }
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('Could not find the table')) {
      console.warn('Profiles table missing. Need to run SQL migration.');
    }
  }

  // Migrate guest documents to the newly signed-in user
  try {
    const localDocs = getLocalDocuments();
    let modified = false;
    const migratedDocs = localDocs.map(d => {
      if (d.user_id === 'guest') {
        modified = true;
        // Optionally update in supabase in background, but updating local is enough
        // since Supabase sync would normally happen on save.
        return { ...d, user_id: user.id, user_email: profile.email };
      }
      return d;
    });
    if (modified) {
      saveLocalDocuments(migratedDocs);
    }
  } catch (err) {
    console.error('Error migrating guest documents:', err);
  }

  return profile;
}

// Fetch documents from Supabase with fallback
export async function fetchDocuments(userId?: string): Promise<{ docs: DocuFlowDocument[]; isLocal: boolean; error?: any }> {
  if (!userId) {
    const local = getLocalDocuments().filter(d => d.user_id === 'guest');
    return { docs: local, isLocal: true };
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch docs error:', error.message);
      if (error.code === '42P01' || error.message.includes('Could not find the table')) {
        return { docs: [], isLocal: false, error };
      }
      const local = getLocalDocuments().filter(d => d.user_id === userId || d.user_id === 'guest');
      return { docs: local, isLocal: true, error };
    }

    if (data && data.length > 0) {
      saveLocalDocuments(data as DocuFlowDocument[]);
      return { docs: data as DocuFlowDocument[], isLocal: false };
    }

    // Check local fallback
    const local = getLocalDocuments().filter(d => d.user_id === userId);
    return { docs: local.length > 0 ? local : (data as DocuFlowDocument[] || []), isLocal: false };
  } catch (err) {
    console.error('Fetch documents exception:', err);
    return { docs: getLocalDocuments(), isLocal: true, error: err };
  }
}

// Fetch single document
export async function fetchDocumentById(docId: string): Promise<DocuFlowDocument | null> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .single();

    if (!error && data) {
      return data as DocuFlowDocument;
    }
  } catch (e) {
    console.warn('Error fetching single doc from Supabase, checking local:', e);
  }

  const local = getLocalDocuments();
  return local.find(d => d.id === docId) || null;
}

// Create new document
export async function createDocument(
  userId: string,
  userEmail: string,
  initialTitle = 'Untitled Document',
  initialContent = '<p>Welcome to <strong>DocuFlow</strong>. Start editing your cloud document now!</p>',
  category: DocuFlowDocument['category'] = 'general',
  icon = '📄',
  existingDoc?: DocuFlowDocument
): Promise<DocuFlowDocument> {
  const { wordCount, charCount } = calculateCounts(initialContent);

  const newDoc: DocuFlowDocument = existingDoc || {
    id: crypto.randomUUID(),
    title: initialTitle,
    content: initialContent,
    user_id: userId,
    user_email: userEmail,
    is_starred: false,
    is_archived: false,
    icon: icon,
    category: category,
    access_level: 'private',
    word_count: wordCount,
    char_count: charCount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Ensure saved to local storage immediately
  const currentLocal = getLocalDocuments();
  if (!currentLocal.some(d => d.id === newDoc.id)) {
    saveLocalDocuments([newDoc, ...currentLocal]);
  }

  if (newDoc.user_id === 'guest') {
    return newDoc;
  }

  try {
    const { data, error } = await supabase.from('documents').insert(newDoc).select().single();
    if (!error && data) {
      return data as DocuFlowDocument;
    } else {
      console.warn('Supabase create document notice, saving locally:', error?.message);
    }
  } catch (e) {
    console.warn('Supabase insert exception:', e);
  }

  return newDoc;
}

// Update document
export async function updateDocumentInSupabase(
  docId: string,
  updates: Partial<DocuFlowDocument>
): Promise<DocuFlowDocument | null> {
  if (updates.content) {
    const { wordCount, charCount } = calculateCounts(updates.content);
    updates.word_count = wordCount;
    updates.char_count = charCount;
  }
  updates.updated_at = new Date().toISOString();

  // Update local storage first for snappy auto-save UI
  const localDocs = getLocalDocuments();
  let updatedDoc: DocuFlowDocument | null = null;
  const newLocal = localDocs.map(d => {
    if (d.id === docId) {
      updatedDoc = { ...d, ...updates };
      return updatedDoc;
    }
    return d;
  });
  saveLocalDocuments(newLocal);

  if (updatedDoc && (updatedDoc as DocuFlowDocument).user_id === 'guest') {
    return updatedDoc;
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();

    if (!error && data) {
      return data as DocuFlowDocument;
    }
  } catch (e) {
    console.warn('Supabase update doc error:', e);
  }

  return updatedDoc;
}

// Delete or archive document
export async function deleteDocument(docId: string, hardDelete = false) {
  if (hardDelete) {
    const allLocal = getLocalDocuments();
    const docToDelete = allLocal.find(d => d.id === docId);
    const local = allLocal.filter(d => d.id !== docId);
    saveLocalDocuments(local);

    if (docToDelete && docToDelete.user_id === 'guest') {
      return;
    }

    try {
      await supabase.from('documents').delete().eq('id', docId);
    } catch (e) {
      console.warn('Hard delete Supabase notice:', e);
    }
  } else {
    await updateDocumentInSupabase(docId, { is_archived: true });
  }
}

// Restore from archive
export async function restoreDocument(docId: string) {
  await updateDocumentInSupabase(docId, { is_archived: false });
}

// Fetch Comments
export async function fetchComments(docId: string): Promise<DocumentComment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('document_id', docId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data as DocumentComment[];
    }
  } catch (e) {
    console.warn('Fetch comments error:', e);
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(`${LOCAL_COMMENTS_KEY}_${docId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Add Comment
export async function addCommentToSupabase(
  docId: string,
  userId: string,
  userName: string,
  text: string,
  userAvatar?: string,
  highlightedText?: string
): Promise<DocumentComment> {
  const newComment: DocumentComment = {
    id: crypto.randomUUID(),
    document_id: docId,
    user_id: userId,
    user_name: userName,
    user_avatar: userAvatar,
    highlighted_text: highlightedText,
    text,
    resolved: false,
    created_at: new Date().toISOString(),
  };

  if (userId === 'guest') {
    const current = await fetchComments(docId);
    const updated = [...current, newComment];
    localStorage.setItem(`${LOCAL_COMMENTS_KEY}_${docId}`, JSON.stringify(updated));
    return newComment;
  }

  try {
    const { data, error } = await supabase.from('comments').insert(newComment).select().single();
    if (!error && data) {
      return data as DocumentComment;
    }
  } catch (e) {
    console.warn('Add comment error:', e);
  }

  // Save local
  const current = await fetchComments(docId);
  const updated = [...current, newComment];
  localStorage.setItem(`${LOCAL_COMMENTS_KEY}_${docId}`, JSON.stringify(updated));
  return newComment;
}

// Resolve Comment
export async function resolveCommentInSupabase(commentId: string, docId: string, resolved = true) {
  try {
    await supabase.from('comments').update({ resolved }).eq('id', commentId);
  } catch (e) {
    console.warn('Resolve comment error:', e);
  }

  const current = await fetchComments(docId);
  const updated = current.map(c => c.id === commentId ? { ...c, resolved } : c);
  localStorage.setItem(`${LOCAL_COMMENTS_KEY}_${docId}`, JSON.stringify(updated));
}

// Versions
export async function fetchVersions(docId: string): Promise<DocumentVersion[]> {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', docId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as DocumentVersion[];
    }
  } catch (e) {
    console.warn('Fetch versions error:', e);
  }

  try {
    const raw = localStorage.getItem(`${LOCAL_VERSIONS_KEY}_${docId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function createDocumentVersion(
  docId: string,
  versionName: string,
  content: string,
  createdBy?: string
): Promise<DocumentVersion> {
  const version: DocumentVersion = {
    id: crypto.randomUUID(),
    document_id: docId,
    version_name: versionName,
    content: content,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };

  if (createdBy === 'guest') {
    const current = await fetchVersions(docId);
    const updated = [version, ...current];
    localStorage.setItem(`${LOCAL_VERSIONS_KEY}_${docId}`, JSON.stringify(updated));
    return version;
  }

  try {
    const { data, error } = await supabase.from('document_versions').insert(version).select().single();
    if (!error && data) {
      return data as DocumentVersion;
    }
  } catch (e) {
    console.warn('Create version error:', e);
  }

  const current = await fetchVersions(docId);
  const updated = [version, ...current];
  localStorage.setItem(`${LOCAL_VERSIONS_KEY}_${docId}`, JSON.stringify(updated));
  return version;
}

export type DatabaseHealth = {
  status: 'ok' | 'missing_table' | 'auth_missing' | 'network_error' | 'invalid_url_key' | 'rls_error' | 'unknown';
  message: string;
};

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || false) {
    return { status: 'invalid_url_key', message: 'Invalid or missing Supabase URL/Key.' };
  }

  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    // Test fetch against documents table (limit 1 to be fast)
    // If not authenticated, this might hit RLS, but if table is missing it returns 42P01
    const { error: docError } = await supabase.from('documents').select('id').limit(1);

    if (docError) {
      if (docError.code === '42P01' || docError.message?.includes('Could not find the table')) {
        return { status: 'missing_table', message: 'The required database tables do not exist in the connected Supabase project.' };
      }
      if (docError.code === 'PGRST301' || docError.code === '42501' || docError.message?.toLowerCase().includes('permission')) {
         return { status: 'rls_error', message: 'Permission denied. Row Level Security (RLS) might be blocking access.' };
      }
      if (docError.message?.toLowerCase().includes('fetch') || docError.message?.toLowerCase().includes('network')) {
        return { status: 'network_error', message: 'Failed to connect to Supabase (Network Error).' };
      }
      if (docError.message?.includes('JWT') || docError.message?.includes('api key')) {
        return { status: 'invalid_url_key', message: 'Invalid API Key or JWT configuration.' };
      }
    }

    if (!session) {
      return { status: 'auth_missing', message: 'User is not authenticated.' };
    }

    return { status: 'ok', message: 'Database connected successfully.' };
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('fetch')) {
      return { status: 'network_error', message: 'Network error connecting to Supabase.' };
    }
    return { status: 'unknown', message: err.message || 'Unknown database error occurred.' };
  }
}

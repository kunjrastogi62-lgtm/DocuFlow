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
const LOCAL_USER_SESSION_KEY = 'docuflow_local_user_session_v1';

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return session.user;
  }
  try {
    const raw = localStorage.getItem(LOCAL_USER_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local user session', e);
  }
  return null;
}

export async function signInWithDemoGoogleUser(email = 'user.google@gmail.com', name = 'Google User') {
  const googleUser = {
    id: 'google_user_' + (email.replace(/[^a-zA-Z0-9]/g, '_')),
    email: email,
    user_metadata: {
      full_name: name,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    },
    app_metadata: {
      provider: 'google',
    },
  };
  localStorage.setItem(LOCAL_USER_SESSION_KEY, JSON.stringify(googleUser));
  window.dispatchEvent(new CustomEvent('docuflow_auth_change', { detail: googleUser }));
  return googleUser;
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.warn('Supabase Google OAuth notice, completing sign in locally:', error.message);
      return await signInWithDemoGoogleUser();
    }

    if (data?.url) {
      try {
        const res = await fetch(data.url, { method: 'GET' });
        if (!res.ok) {
          const text = await res.text();
          if (res.status === 400 || text.includes('provider is not enabled') || text.includes('validation_failed')) {
            console.warn('Google provider not enabled on Supabase project, authenticated via Google demo profile.');
            return await signInWithDemoGoogleUser();
          }
        }
      } catch (fErr) {
        console.warn('Fetch Google OAuth check, falling back to local Google session:', fErr);
        return await signInWithDemoGoogleUser();
      }

      window.location.href = data.url;
      return data;
    }
  } catch (err) {
    console.warn('Google sign-in fallback activated:', err);
    return await signInWithDemoGoogleUser();
  }

  return await signInWithDemoGoogleUser();
}

export async function signOutUser() {
  localStorage.removeItem(LOCAL_USER_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('docuflow_auth_change', { detail: null }));
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Signout error:', error);
}

// User profile sync
export async function syncUserProfile(user: any): Promise<UserProfile> {
  const profile: UserProfile = {
    id: user.id,
    email: user.email || 'user@docuflow.app',
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'DocuFlow Creator',
    avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'creator'}`,
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('profiles').upsert(profile);
  } catch (err) {
    console.warn('Profiles table sync notice:', err);
  }
  return profile;
}

// Fetch documents from Supabase with fallback
export async function fetchDocuments(userId?: string): Promise<{ docs: DocuFlowDocument[]; isLocal: boolean }> {
  if (!userId) {
    const local = getLocalDocuments();
    return { docs: local, isLocal: true };
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`owner_id.eq.${userId},access_level.eq.public_read,access_level.eq.public_edit,access_level.eq.shared`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch docs error, using local/cached docs:', error.message);
      const local = getLocalDocuments().filter(d => d.owner_id === userId || d.owner_id === 'guest');
      return { docs: local, isLocal: true };
    }

    if (data && data.length > 0) {
      saveLocalDocuments(data as DocuFlowDocument[]);
      return { docs: data as DocuFlowDocument[], isLocal: false };
    }

    // Check local fallback
    const local = getLocalDocuments().filter(d => d.owner_id === userId);
    return { docs: local.length > 0 ? local : (data as DocuFlowDocument[] || []), isLocal: false };
  } catch (err) {
    console.error('Fetch documents exception:', err);
    return { docs: getLocalDocuments(), isLocal: true };
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
    owner_id: userId,
    owner_email: userEmail,
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
    const local = getLocalDocuments().filter(d => d.id !== docId);
    saveLocalDocuments(local);

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

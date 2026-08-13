import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchDocuments, 
  createDocument, 
  updateDocumentInSupabase, 
  deleteDocument, 
  restoreDocument, 
  getCurrentUser, 
  syncUserProfile,
  fetchComments,
  addCommentToSupabase,
  resolveCommentInSupabase,
  fetchVersions,
  createDocumentVersion,
  signOutUser,
  calculateCounts
} from './lib/supabase';
import { supabase } from './lib/supabase';
import { DocuFlowDocument, UserProfile, ViewTab, DocumentComment, DocumentVersion } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DocumentDashboard } from './components/DocumentDashboard';
import { DocumentEditor } from './components/DocumentEditor';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocuFlowDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Document specific state
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  // Check URL query parameters for directly opening shared documents
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedDocId = params.get('doc');
    if (sharedDocId) {
      setActiveDocId(sharedDocId);
    }
  }, []);

  // Initialize Auth & Load User Profile
  useEffect(() => {
    async function initAuth() {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const userProfile = await syncUserProfile(currentUser);
        setProfile(userProfile);
      }
      loadDocs(currentUser?.id);
    }

    initAuth();

    const handleCustomAuthChange = async (e: Event) => {
      const customUser = (e as CustomEvent).detail;
      if (customUser) {
        setUser(customUser);
        const p = await syncUserProfile(customUser);
        setProfile(p);
        loadDocs(customUser.id);
      } else {
        setUser(null);
        setProfile(null);
        setActiveDocId(null);
        loadDocs(null);
      }
    };

    window.addEventListener('docuflow_auth_change', handleCustomAuthChange);

    // Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const p = await syncUserProfile(session.user);
        setProfile(p);
        loadDocs(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setActiveDocId(null);
        loadDocs(null);
      }
    });

    return () => {
      window.removeEventListener('docuflow_auth_change', handleCustomAuthChange);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch documents from Supabase with fallback
  const loadDocs = async (overrideUserId?: string | null) => {
    const targetUserId = overrideUserId !== undefined ? overrideUserId : user?.id;
    const { docs } = await fetchDocuments(targetUserId || undefined);
    setDocuments(docs);
  };

  // Load comments & versions when active document changes
  useEffect(() => {
    if (activeDocId) {
      fetchComments(activeDocId).then(setComments);
      fetchVersions(activeDocId).then(setVersions);
    }
  }, [activeDocId]);

  // Create new document
  const handleCreateNewDocument = (
    title = 'Untitled Document',
    content = '<p>Welcome to <strong>DocuFlow</strong>. Start typing here...</p>',
    category: DocuFlowDocument['category'] = 'general',
    icon = '📄'
  ) => {
    // Close open modals
    setIsAuthModalOpen(false);

    const ownerId = user?.id || 'guest';
    const ownerEmail = user?.email || 'guest@docuflow.app';

    const { wordCount, charCount } = calculateCounts(content);
    const newDoc: DocuFlowDocument = {
      id: crypto.randomUUID(),
      title,
      content,
      owner_id: ownerId,
      owner_email: ownerEmail,
      is_starred: false,
      is_archived: false,
      icon,
      category,
      access_level: 'private',
      word_count: wordCount,
      char_count: charCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Immediately show new document editor
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);

    // Persist in background
    createDocument(ownerId, ownerEmail, title, content, category, icon, newDoc);
  };

  // Update Document with Debounced auto-save
  const handleUpdateDocument = useCallback(async (docId: string, updates: Partial<DocuFlowDocument>) => {
    setIsSaving(true);
    
    // Optimistic state update
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, ...updates, updated_at: new Date().toISOString() } : d))
    );

    await updateDocumentInSupabase(docId, updates);
    
    setTimeout(() => {
      setIsSaving(false);
    }, 400);
  }, []);

  // Toggle Star
  const handleToggleStar = async (docId: string, currentStarred: boolean) => {
    handleUpdateDocument(docId, { is_starred: !currentStarred });
  };

  // Delete document
  const handleDeleteDocument = async (docId: string, hardDelete = false) => {
    await deleteDocument(docId, hardDelete);
    if (hardDelete) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } else {
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, is_archived: true } : d)));
    }
    if (activeDocId === docId) {
      setActiveDocId(null);
    }
  };

  // Restore document
  const handleRestoreDocument = async (docId: string) => {
    await restoreDocument(docId);
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, is_archived: false } : d)));
  };

  // Duplicate document
  const handleDuplicateDocument = async (doc: DocuFlowDocument) => {
    const ownerId = user?.id || 'guest';
    const ownerEmail = user?.email || 'guest@docuflow.app';
    const dupDoc = await createDocument(
      ownerId,
      ownerEmail,
      `${doc.title} (Copy)`,
      doc.content,
      doc.category,
      doc.icon
    );
    setDocuments((prev) => [dupDoc, ...prev]);
  };

  // Rename document title
  const handleRenameDocument = async (docId: string, newTitle: string) => {
    handleUpdateDocument(docId, { title: newTitle });
  };

  // Comment Handlers
  const handleAddComment = async (text: string, highlightedText?: string) => {
    if (!activeDocId) return;
    const userId = user?.id || 'guest';
    const userName = profile?.full_name || user?.email || 'DocuFlow Editor';
    const userAvatar = profile?.avatar_url;

    const comment = await addCommentToSupabase(activeDocId, userId, userName, text, userAvatar, highlightedText);
    setComments((prev) => [...prev, comment]);
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    if (!activeDocId) return;
    await resolveCommentInSupabase(commentId, activeDocId, resolved);
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, resolved } : c)));
  };

  // Version Handlers
  const handleCreateVersion = async (name: string) => {
    const activeDoc = documents.find((d) => d.id === activeDocId);
    if (!activeDoc) return;

    const version = await createDocumentVersion(activeDoc.id, name, activeDoc.content, user?.id);
    setVersions((prev) => [version, ...prev]);
  };

  const handleRestoreVersion = async (version: DocumentVersion) => {
    if (!activeDocId) return;
    handleUpdateDocument(activeDocId, { content: version.content });
  };

  // Sign out handler
  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
    setActiveDocId(null);
    loadDocs(null);
  };

  // Calculate counts for sidebar badge
  const docCounts = {
    all: documents.filter((d) => !d.is_archived).length,
    starred: documents.filter((d) => d.is_starred && !d.is_archived).length,
    shared: documents.filter((d) => (d.access_level === 'shared' || d.access_level === 'public_read' || d.access_level === 'public_edit') && !d.is_archived).length,
    trash: documents.filter((d) => d.is_archived).length,
  };

  const activeDoc = documents.find((d) => d.id === activeDocId);

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/30 via-slate-50 to-slate-100 text-slate-900 flex flex-col font-sans relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[100px]" />
        <div className="absolute top-[60%] -left-[10%] w-[30%] h-[30%] rounded-full bg-indigo-200/20 blur-[100px]" />
      </div>
      
      {/* If in Editor mode, display full editor */}
      {activeDocId && activeDoc ? (
        <div className="z-10 flex-1 flex flex-col overflow-hidden">
          <DocumentEditor
          doc={activeDoc}
          onGoBack={() => {
            setActiveDocId(null);
            // clear URL params if any
            if (window.location.search) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          onUpdateDocument={handleUpdateDocument}
          comments={comments}
          onAddComment={handleAddComment}
          onResolveComment={handleResolveComment}
          versions={versions}
          onCreateVersion={handleCreateVersion}
          onRestoreVersion={handleRestoreVersion}
          isSaving={isSaving}
        />
        </div>
      ) : (
        /* Dashboard Mode */
        <div className="z-10 flex-1 flex flex-col overflow-hidden">
          <Navbar
            user={user}
            profile={profile}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewDocument={() => handleCreateNewDocument()}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSignOut={handleSignOut}
            onGoHome={() => {
              setActiveDocId(null);
              setActiveTab('all');
              setSelectedCategory(null);
            }}
          />

          <div className="flex-1 flex overflow-hidden">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              onNewDoc={() => handleCreateNewDocument()}
              docCounts={docCounts}
            />

            <DocumentDashboard
              documents={documents}
              activeTab={activeTab}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onOpenDoc={(docId) => setActiveDocId(docId)}
              onNewDoc={handleCreateNewDocument}
              onToggleStar={handleToggleStar}
              onDeleteDoc={handleDeleteDocument}
              onRestoreDoc={handleRestoreDocument}
              onShareDoc={(doc) => setActiveDocId(doc.id)}
              onDuplicateDoc={handleDuplicateDocument}
              onRenameDoc={handleRenameDocument}
            />
          </div>

          {/* Footer Branding */}
          <footer className="h-12 border-t border-slate-200 bg-white flex items-center px-8 text-[11px] text-slate-400 justify-between shrink-0">
            <span>© 2026 DocuFlow • Professional Cloud Document Editor</span>
            <span className="font-mono">v2.4.1-stable</span>
          </footer>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          if (user?.id) loadDocs(user.id);
        }}
      />
    </div>
  );
}

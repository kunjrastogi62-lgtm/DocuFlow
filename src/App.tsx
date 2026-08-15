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
import { 
  FileText, 
  Star, 
  Clock, 
  Trash2, 
  Folder, 
  Plus, 
  Layers 
} from 'lucide-react';

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    setIsMobileSidebarOpen(false);

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
        <div className="z-10 flex-1 flex flex-col overflow-hidden relative">
          <Navbar
            user={user}
            profile={profile}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewDocument={() => handleCreateNewDocument()}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSignOut={handleSignOut}
            onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onGoHome={() => {
              setActiveDocId(null);
              setActiveTab('all');
              setSelectedCategory(null);
            }}
          />

          <div className="flex-1 flex overflow-hidden">
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setIsMobileSidebarOpen(false);
              }}
              selectedCategory={selectedCategory}
              onCategorySelect={(cat) => {
                setSelectedCategory(cat);
                setIsMobileSidebarOpen(false);
              }}
              onNewDoc={() => handleCreateNewDocument()}
              docCounts={docCounts}
              isOpenOnMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
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
                onSelectCategory={setSelectedCategory}
              />
          </div>

          {/* Desktop/Tablet Floating Action Button */}
          <button
            onClick={() => handleCreateNewDocument()}
            className="hidden md:flex fixed bottom-14 right-10 z-40 items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-full shadow-xl shadow-blue-500/30 border-2 border-white transition-transform hover:scale-105"
            title="Create New Document"
          >
            <Plus className="w-8 h-8 stroke-[2.5]" />
          </button>

          {/* Mobile Bottom Navigation Bar (Visible on mobile screens) */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveTab('all');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition-all relative ${
                activeTab === 'all' && selectedCategory === null
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>All Docs</span>
              {docCounts.all > 0 && (
                <span className="absolute 1 top-0.5 right-1.5 w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">
                  {docCounts.all}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveTab('starred');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition-all relative ${
                activeTab === 'starred'
                  ? 'text-amber-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Starred</span>
              {docCounts.starred > 0 && (
                <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold flex items-center justify-center">
                  {docCounts.starred}
                </span>
              )}
            </button>

            {/* Mobile Central Floating New Document Button */}
            <button
              onClick={() => handleCreateNewDocument()}
              className="flex items-center justify-center w-12 h-12 -mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-full shadow-lg shadow-blue-500/30 border-2 border-white transition-transform"
              title="Create New Document"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>

            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveTab('recent');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition-all ${
                activeTab === 'recent'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Recent</span>
            </button>

            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveTab('trash');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition-all relative ${
                activeTab === 'trash'
                  ? 'text-red-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              <span>Trash</span>
              {docCounts.trash > 0 && (
                <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-red-100 text-red-700 text-[9px] font-bold flex items-center justify-center">
                  {docCounts.trash}
                </span>
              )}
            </button>
          </nav>

          {/* Footer Branding on Desktop */}
          <footer className="hidden md:flex h-11 border-t border-slate-200 bg-white items-center px-8 text-[11px] text-slate-400 justify-between shrink-0">
            <span>© 2026 DocuFlow • Professional Cloud Document Editor</span>
            <span className="font-mono">v2.4.1-stable</span>
          </footer>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        canClose={true}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={async () => {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            const p = await syncUserProfile(currentUser);
            setProfile(p);
            loadDocs(currentUser.id);
          }
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}


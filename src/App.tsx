import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchDocuments, 
  saveDocument, 
  deleteDocument, 
  restoreDocument, 
  getCurrentUser, 
  syncUserProfile,
  checkDatabaseHealth,
  DatabaseHealth,
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
  Layers,
  Database,
  WifiOff,
  Lock,
  Key,
  AlertTriangle
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
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
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
      // Run health check first
      const health = await checkDatabaseHealth();
      setDbHealth(health);
      
      // If table missing or critical error, stop auth loading to prevent 404 floods
      if (health.status === 'missing_table' || health.status === 'invalid_url_key' || health.status === 'network_error') {
        return;
      }

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
    const { docs, error } = await fetchDocuments(targetUserId || undefined);
    
    if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
      setDbHealth({ status: 'missing_table', message: 'The required database tables do not exist.' });
      return; // Do not use silent fallback when setup is just missing
    }
    
    // Only update health to ok if it was previously an error
    setDbHealth(prev => (prev && prev.status !== 'ok' && prev.status !== 'auth_missing') ? { status: 'ok', message: 'Connected' } : prev);
    setDocuments(docs);
  };

  // Load comments & versions when active document changes
  useEffect(() => {
    if (activeDocId) {
      fetchComments(activeDocId).then(setComments);
      fetchVersions(activeDocId).then(setVersions);
    }
  }, [activeDocId]);

  // Create new document (In-Memory Only, nothing saved yet!)
  const handleCreateNewDocument = (
    title = 'Untitled Document',
    content = '<p>Welcome to <strong>DocuFlow</strong>. Start typing here...</p>',
    category: DocuFlowDocument['category'] = 'general',
    icon = '📄'
  ) => {
    // Close open modals
    setIsAuthModalOpen(false);
    setIsMobileSidebarOpen(false);

    const userId = user?.id || 'guest';
    const userEmail = user?.email || 'guest@docuflow.app';

    const newDoc: DocuFlowDocument = {
      id: crypto.randomUUID(),
      title,
      content,
      user_id: userId,
      user_email: userEmail,
      is_starred: false,
      is_archived: false,
      icon,
      category,
      access_level: 'private',
      word_count: 0,
      char_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mark as a brand-new unsaved document
    const newDocWithFlag = { ...newDoc, isNewUnsaved: true } as any;

    // Immediately show new document editor
    setDocuments((prev) => [newDocWithFlag, ...prev]);
    setActiveDocId(newDocWithFlag.id);
  };

  // Update Document state locally in React memory (no DB write)
  const handleUpdateDocument = useCallback((docId: string, updates: Partial<DocuFlowDocument>) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, ...updates, updated_at: new Date().toISOString() } : d))
    );
  }, []);

  // Permanent Document Save Function (ONE authoritative pathway for editor clicks)
  const handleSaveDocument = async (docId: string, title: string, content: string): Promise<boolean> => {
    console.log("handleSaveDocument called", { docId, title });
    setIsSaving(true);
    
    // Find the current document in state
    const doc = documents.find((d) => d.id === docId);
    if (!doc) {
      console.error("Document save failed: Document not found in local state");
      setIsSaving(false);
      return false;
    }

    const isNew = !!(doc as any).isNewUnsaved;

    // Call the single, authoritative saveDocument function
    const { data, error } = await saveDocument({ ...doc, title, content }, isNew);

    if (error) {
      console.error("Document save failed:", error);
      alert(`Failed to save document. Please try again. Error: ${error.message || error}`);
      setIsSaving(false);
      return false;
    }

    if (data) {
      // Update our local React state with the returned database record and remove isNewUnsaved flag
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...data, isNewUnsaved: false } as any : d))
      );
      setIsSaving(false);
      return true;
    }

    setIsSaving(false);
    return false;
  };

  // Toggle Star (from dashboard: writes to DB immediately)
  const handleToggleStar = async (docId: string, currentStarred: boolean) => {
    const nextStarred = !currentStarred;
    handleUpdateDocument(docId, { is_starred: nextStarred });

    const doc = documents.find((d) => d.id === docId);
    if (doc && !(doc as any).isNewUnsaved && doc.user_id !== 'guest') {
      const { error } = await saveDocument({ ...doc, is_starred: nextStarred }, false);
      if (error) {
        console.error("Failed to update star on server:", error);
      }
    }
  };

  // Delete/Archive document (writes to DB immediately)
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

  // Restore document (writes to DB immediately)
  const handleRestoreDocument = async (docId: string) => {
    await restoreDocument(docId);
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, is_archived: false } : d)));
  };

  // Duplicate document (writes to DB immediately)
  const handleDuplicateDocument = async (doc: DocuFlowDocument) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please sign in to duplicate documents.");
      return;
    }

    const { wordCount, charCount } = calculateCounts(doc.content);
    const dupDoc: DocuFlowDocument = {
      id: crypto.randomUUID(),
      title: `${doc.title} (Copy)`,
      content: doc.content,
      user_id: user.id,
      user_email: user.email || '',
      is_starred: false,
      is_archived: false,
      icon: doc.icon || '📄',
      category: doc.category || 'general',
      access_level: 'private',
      word_count: wordCount,
      char_count: charCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDocuments((prev) => [dupDoc, ...prev]);

    const { data, error } = await saveDocument(dupDoc, true);
    if (error) {
      console.error("Duplicate document save failed:", error);
      alert("Failed to duplicate document on server.");
      setDocuments((prev) => prev.filter((d) => d.id !== dupDoc.id));
    } else if (data) {
      setDocuments((prev) => prev.map((d) => (d.id === dupDoc.id ? data : d)));
    }
  };

  // Rename document title (from dashboard: writes to DB immediately)
  const handleRenameDocument = async (docId: string, newTitle: string) => {
    handleUpdateDocument(docId, { title: newTitle });

    const doc = documents.find((d) => d.id === docId);
    if (doc && !(doc as any).isNewUnsaved && doc.user_id !== 'guest') {
      const { error } = await saveDocument({ ...doc, title: newTitle }, false);
      if (error) {
        console.error("Failed to rename document on server:", error);
      }
    }
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

  if (dbHealth && dbHealth.status !== 'ok' && dbHealth.status !== 'auth_missing') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md text-center">
          {dbHealth.status === 'missing_table' && <Database className="w-12 h-12 text-red-500 mx-auto mb-4" />}
          {dbHealth.status === 'network_error' && <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />}
          {dbHealth.status === 'rls_error' && <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />}
          {dbHealth.status === 'invalid_url_key' && <Key className="w-12 h-12 text-red-500 mx-auto mb-4" />}
          {dbHealth.status === 'unknown' && <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />}
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {dbHealth.status === 'missing_table' ? 'Database Setup Incomplete' : 'Connection Error'}
          </h2>
          <p className="text-slate-600 mb-6 text-sm">
            {dbHealth.message}
          </p>
          {dbHealth.status === 'missing_table' && (
             <p className="text-slate-500 text-xs">
                Please run the DocuFlow Supabase SQL migration in your Supabase dashboard to create the 'profiles' and 'documents' tables.
             </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] md:min-h-screen dark-tech-gradient text-slate-900 flex flex-col font-sans relative md:overflow-hidden">
      {/* Animated Deep Tech Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 mix-blend-screen blur-[120px] opacity-60 animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/20 mix-blend-screen blur-[120px] opacity-60 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/20 mix-blend-screen blur-[120px] opacity-60 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[60px]" />
      </div>
      
      {/* Central Glassmorphism App Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col w-full md:h-full lg:max-w-[1600px] lg:mx-auto lg:my-0 lg:border-x lg:border-white/20 lg:shadow-2xl glass-panel md:overflow-hidden transition-all duration-500">
        {/* If in Editor mode, display full editor */}
      {activeDocId && activeDoc ? (
        <div className="z-10 flex-1 flex flex-col overflow-hidden">
          <DocumentEditor
            doc={activeDoc}
            onGoBack={() => {
              // Filter out any brand-new unsaved documents when going back
              setDocuments((prev) => prev.filter((d) => !(d as any).isNewUnsaved));
              setActiveDocId(null);
              // clear URL params if any
              if (window.location.search) {
                window.history.replaceState({}, '', window.location.pathname);
              }
            }}
            onUpdateDocument={handleUpdateDocument}
            onSaveDocument={handleSaveDocument}
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
        <div className="z-10 flex-1 flex flex-col md:overflow-hidden relative">
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

          <div className="flex-1 flex md:overflow-hidden">
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
      </div>

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


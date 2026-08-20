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
import { 
  DocuFlowDocument, 
  UserProfile, 
  ViewTab, 
  DocumentComment, 
  DocumentVersion,
  UserSettings,
  ToastMessage
} from './types';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DocumentDashboard } from './components/DocumentDashboard';
import { DocumentEditor } from './components/DocumentEditor';
import { AuthModal } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ToastContainer } from './components/ToastContainer';
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

const DEFAULT_SETTINGS: UserSettings = {
  autoSaveInterval: 15,
  defaultFontFamily: 'sans',
  spellCheck: true,
  focusMode: false,
  showWordCount: true,
  soundEffects: false,
  defaultCategory: 'general',
};

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

  // Professional Modals & Utility States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // User Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('docuflow_user_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('docuflow_user_settings', JSON.stringify(updated));
      return updated;
    });
    showToast('Settings saved successfully', 'success');
  };

  // Toast notifications helper
  const showToast = useCallback((
    message: string,
    type: 'success' | 'info' | 'error' | 'warning' = 'info',
    actionLabel?: string,
    onAction?: () => void
  ) => {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { id, message, type, actionLabel, onAction };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  
  // Permanently Light Mode
  const theme: 'light' | 'dark' = 'light';
  const toggleTheme = () => {};

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('docuflow_theme', 'light');
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K, ?, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette (Ctrl+K or Cmd+K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Keyboard Shortcuts guide ('?' when not actively typing in an input/textarea/editor)
      const target = e.target as HTMLElement;
      const isTyping = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      if (!isTyping && e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      // Escape key closes open modals
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isShortcutsOpen, isSettingsOpen]);

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
      showToast(`Failed to save document. Please try again.`, 'error');
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
    showToast(nextStarred ? 'Document starred' : 'Document unstarred', 'info');

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
      showToast('Document permanently deleted', 'info');
    } else {
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, is_archived: true } : d)));
      showToast('Document moved to trash', 'warning', 'Undo', () => handleRestoreDocument(docId));
    }
    if (activeDocId === docId) {
      setActiveDocId(null);
    }
  };

  // Restore document (writes to DB immediately)
  const handleRestoreDocument = async (docId: string) => {
    await restoreDocument(docId);
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, is_archived: false } : d)));
    showToast('Document restored successfully', 'success');
  };

  // Duplicate document (writes to DB immediately)
  const handleDuplicateDocument = async (doc: DocuFlowDocument) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('Please sign in to duplicate documents', 'warning');
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
    showToast(`Created copy of "${doc.title}"`, 'success');

    const { data, error } = await saveDocument(dupDoc, true);
    if (error) {
      console.error("Duplicate document save failed:", error);
      showToast('Failed to save duplicated document to cloud', 'error');
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
        showToast('Failed to rename document. Reverting change.', 'error');
        handleUpdateDocument(docId, { title: doc.title });
      } else {
        showToast('Document renamed successfully', 'success');
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
    <div className="min-h-[100dvh] md:min-h-screen atmospheric-bg bg-grid-pattern theme-light text-slate-800 flex flex-col font-sans relative md:overflow-hidden transition-all duration-300">
      
      {/* Ambient Atmospheric Bloom Elements matching screenshot */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Luminous Pale White-Cyan Center Glow */}
        <div className="absolute top-[18%] left-[24%] w-[42rem] h-[34rem] bg-white/70 rounded-full blur-[110px] transform -translate-x-1/2 -translate-y-1/2" />
        
        {/* Soft Pale Cyan-Blue Top-Left Diffuse */}
        <div className="absolute top-[4%] left-[6%] w-[34rem] h-[28rem] bg-[#e0f0ff]/80 rounded-full blur-[90px]" />
        
        {/* Deep Vibrant Violet/Purple Bloom on Right */}
        <div className="absolute top-[38%] right-[-6%] w-[44rem] h-[46rem] bg-[#7d64f0]/50 rounded-full blur-[130px]" />
        
        {/* Saturated Bottom-Right Violet Glow */}
        <div className="absolute bottom-[-12%] right-[8%] w-[36rem] h-[36rem] bg-[#674ee5]/55 rounded-full blur-[120px]" />
        
        {/* Deep Ocean Sapphire/Periwinkle on Bottom-Left */}
        <div className="absolute bottom-[-6%] left-[-6%] w-[38rem] h-[38rem] bg-[#3a62d7]/50 rounded-full blur-[110px]" />
        
        {/* Top-Right Dusky Violet Accent */}
        <div className="absolute top-[-6%] right-[14%] w-[30rem] h-[26rem] bg-[#53438f]/40 rounded-full blur-[95px]" />
      </div>

      {/* Central Glassmorphism App Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col w-full md:h-full lg:max-w-[1600px] lg:mx-auto lg:my-0 lg:border-x lg:border-white/40 lg:shadow-2xl glass-panel theme-light md:overflow-hidden transition-all duration-500">
        {/* If in Editor mode, display full editor */}
      {activeDocId && activeDoc ? (
        <div className="z-10 flex-1 flex flex-col overflow-hidden">
          <DocumentEditor
            doc={activeDoc}
            settings={settings}
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
            theme={theme}
            onShowToast={showToast}
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
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
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
              theme={theme}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
            />

            
              <DocumentDashboard
                documents={documents}
                activeTab={activeTab}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                settings={settings}
                onOpenDoc={(docId) => setActiveDocId(docId)}
                onNewDoc={handleCreateNewDocument}
                onToggleStar={handleToggleStar}
                onDeleteDoc={handleDeleteDocument}
                onRestoreDoc={handleRestoreDocument}
                onShareDoc={(doc) => setActiveDocId(doc.id)}
                onDuplicateDoc={handleDuplicateDocument}
                onRenameDoc={handleRenameDocument}
                onSelectCategory={setSelectedCategory}
                theme={theme}
                onToggleTheme={toggleTheme}
                onShowToast={showToast}
              />
          </div>

          {/* Desktop/Tablet Floating Action Button */}
          <button
            onClick={() => handleCreateNewDocument()}
            className="hidden md:flex fixed bottom-14 right-10 z-40 items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-full shadow-xl shadow-blue-500/30 border-2 border-white transition-transform hover:scale-105 cursor-pointer"
            title="Create New Document"
          >
            <Plus className="w-8 h-8 stroke-[2.5]" />
          </button>

          {/* Mobile Bottom Navigation Bar (Visible on mobile screens) */}
          <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t px-3 py-2 flex items-center justify-around shadow-lg transition-colors ${theme === 'light' ? 'bg-white/95 border-slate-200 text-slate-500' : 'bg-[#0c0c0e]/95 border-white/[0.05] text-slate-400'}`}>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveTab('all');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition-all relative ${
                activeTab === 'all' && selectedCategory === null
                  ? 'text-blue-600 font-bold'
                  : theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>All Docs</span>
              {docCounts.all > 0 && (
                <span className={`absolute top-0.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-950 text-blue-300'}`}>
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
                  : theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Starred</span>
              {docCounts.starred > 0 && (
                <span className={`absolute top-0.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${theme === 'light' ? 'bg-amber-100 text-amber-700' : 'bg-amber-950 text-amber-300'}`}>
                  {docCounts.starred}
                </span>
              )}
            </button>

            {/* Mobile Central Floating New Document Button */}
            <button
              onClick={() => handleCreateNewDocument()}
              className="flex items-center justify-center w-12 h-12 -mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-full shadow-lg shadow-blue-500/30 border-2 border-white transition-transform cursor-pointer"
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
                  : theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-100'
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
                  : theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              <span>Trash</span>
              {docCounts.trash > 0 && (
                <span className={`absolute top-0.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${theme === 'light' ? 'bg-red-100 text-red-700' : 'bg-red-950 text-red-300'}`}>
                  {docCounts.trash}
                </span>
              )}
            </button>
          </nav>

          {/* Footer Branding on Desktop */}
          <footer className={`hidden md:flex h-11 border-t items-center px-8 text-[11px] justify-between shrink-0 transition-colors ${theme === 'light' ? 'border-slate-200 bg-white text-slate-400' : 'border-white/[0.04] bg-[#0c0c0e] text-slate-500'}`}>
            <span>© 2026 DocuFlow • Professional Cloud Document Editor</span>
            <span className="font-mono">v2.4.1-stable</span>
          </footer>
        </div>
      )}
      </div>

      {/* Global Toast System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        documents={documents}
        onOpenDoc={(docId) => {
          setActiveDocId(docId);
          setIsCommandPaletteOpen(false);
        }}
        onNewDoc={() => {
          handleCreateNewDocument();
          setIsCommandPaletteOpen(false);
        }}
        onOpenSettings={() => {
          setIsCommandPaletteOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenShortcuts={() => {
          setIsCommandPaletteOpen(false);
          setIsShortcutsOpen(true);
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveTab('all');
          setActiveDocId(null);
          setIsCommandPaletteOpen(false);
        }}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedCategory(null);
          setActiveDocId(null);
          setIsCommandPaletteOpen(false);
        }}
      />

      {/* Workspace Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        profile={profile}
        user={user}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

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
            showToast('Signed in successfully', 'success');
          }
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}


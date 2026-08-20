import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Star, 
  MoreVertical, 
  Share2, 
  Trash2, 
  Copy, 
  Grid, 
  List, 
  Clock, 
  ArrowUpDown, 
  Lock, 
  Globe, 
  Users, 
  Edit3, 
  Plus,
  Sparkles,
  Filter,
  CheckCircle2,
  Folder,
  UploadCloud,
  Info,
  Download
} from 'lucide-react';
import { DocuFlowDocument, ViewTab, UserSettings } from '../types';
import { importDocumentFile } from '../lib/documentImporter';
import { DocumentInfoModal } from './DocumentInfoModal';

interface DocumentDashboardProps {
  documents: DocuFlowDocument[];
  activeTab: ViewTab;
  selectedCategory: string | null;
  searchQuery: string;
  onOpenDoc: (docId: string) => void;
  onNewDoc: (title?: string, content?: string, category?: DocuFlowDocument['category'], icon?: string) => void;
  onToggleStar: (docId: string, currentStarred: boolean) => void;
  onDeleteDoc: (docId: string, hardDelete?: boolean) => void;
  onRestoreDoc: (docId: string) => void;
  onShareDoc: (doc: DocuFlowDocument) => void;
  onDuplicateDoc: (doc: DocuFlowDocument) => void;
  onRenameDoc: (docId: string, newTitle: string) => void;
  onSelectCategory?: (category: string | null) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error' | 'warning', actionLabel?: string, onAction?: () => void) => void;
  settings?: UserSettings;
}

export const DocumentDashboard: React.FC<DocumentDashboardProps> = ({
  documents,
  activeTab,
  selectedCategory,
  searchQuery,
  onOpenDoc,
  onNewDoc,
  onToggleStar,
  onDeleteDoc,
  onRestoreDoc,
  onShareDoc,
  onDuplicateDoc,
  onRenameDoc,
  onSelectCategory,
  theme = 'light',
  onToggleTheme,
  onShowToast,
  settings,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'created'>('updated');
  const [menuOpenDocId, setMenuOpenDocId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [infoDoc, setInfoDoc] = useState<DocuFlowDocument | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ docId?: string; isAll?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportMarkdown = (doc: DocuFlowDocument) => {
    const text = (doc.content || '')
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<[^>]*>/g, '');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Exported "${doc.title || 'document'}.md"`, 'success');
  };

  const exportHTML = (doc: DocuFlowDocument) => {
    const fullHtml = `<!DOCTYPE html><html><head><title>${doc.title || 'Document'}</title><meta charset="utf-8"/><style>body{font-family:sans-serif; max-width:800px; margin:40px auto; padding:20px; line-height:1.6;}</style></head><body>${doc.content || ''}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title || 'document'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Exported "${doc.title || 'document'}.html"`, 'success');
  };

  const copyDocText = (doc: DocuFlowDocument) => {
    const plain = (doc.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(plain);
    if (onShowToast) onShowToast('Document text copied to clipboard!', 'info');
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const result = await importDocumentFile(file);
      
      let finalTitle = result.title;
      let counter = 1;
      while (documents.some((d) => d.title.toLowerCase() === finalTitle.toLowerCase() && !d.is_archived)) {
        finalTitle = `${result.title} (${counter})`;
        counter++;
      }

      onNewDoc(finalTitle, result.content, 'general', result.icon);
    } catch (err: any) {
      console.error('Import error:', err);
      setImportError(err.message || 'Failed to parse the document.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenDocId(null);
    if (menuOpenDocId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpenDocId]);

  const categoryPills = [
    { id: null, label: 'All', color: 'bg-slate-400' },
    { id: 'work', label: 'Work', color: 'bg-blue-500' },
    { id: 'project', label: 'Projects', color: 'bg-indigo-500' },
    { id: 'ideas', label: 'Ideas & Specs', color: 'bg-amber-500' },
    { id: 'personal', label: 'Personal', color: 'bg-emerald-500' },
  ];

  // Filter documents based on active tab, category, search
  const filteredDocs = documents.filter((doc) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = doc.title.toLowerCase().includes(q);
      const contentMatch = doc.content.toLowerCase().includes(q);
      if (!titleMatch && !contentMatch) return false;
    }

    // Category filter
    if (selectedCategory && doc.category !== selectedCategory) {
      return false;
    }

    // Tab filter
    if (activeTab === 'trash') {
      return doc.is_archived === true;
    }

    // Non-trash tabs ignore archived docs
    if (doc.is_archived) return false;

    if (activeTab === 'starred') return doc.is_starred === true;
    if (activeTab === 'recent') {
      const diff = Date.now() - new Date(doc.updated_at).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000; // last 7 days
    }

    return true; // 'all'
  });

  // Sorting
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'created') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const handleStartRename = (doc: DocuFlowDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingDocId(doc.id);
    setRenameTitle(doc.title);
    setMenuOpenDocId(null);
  };

  const handleSaveRename = (docId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (renameTitle.trim()) {
      onRenameDoc(docId, renameTitle.trim());
    }
    setRenamingDocId(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const totalWords = documents.reduce((sum, doc) => sum + (doc.word_count || 0), 0);
  const formatWords = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num === 0 ? '12K+' : num.toLocaleString();
  };

  const showHero = activeTab === 'all' && !searchQuery && !selectedCategory;

  return (
    <div className={`flex-1 p-3.5 sm:p-6 lg:p-8 md:overflow-y-auto max-w-6xl mx-auto w-full space-y-8 sm:space-y-12 pb-20 md:pb-12 transition-colors duration-300 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
      
      {/* 🚀 SCREENSHOT RECREATION HERO SECTION */}
      {showHero && (
        <div className="flex flex-col items-center justify-center pt-10 pb-16 sm:pt-24 sm:pb-24 relative z-10 w-full animate-fade-in">
          
          {/* Top Status Badge */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs mb-7 transition-colors ${
            theme === 'light'
              ? 'border-slate-200 bg-slate-100 text-slate-600'
              : 'border-white/[0.08] bg-[#0c0c0e]/80 backdrop-blur-md text-[#a1a1aa]'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium tracking-wide">Available Now · February 2026</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-[clamp(2.25rem,6.5vw,5rem)] font-bold tracking-tight leading-[1.08] text-center max-w-4xl mx-auto select-none font-sans text-slate-900">
            The workspace that thinks<br className="hidden sm:inline" />before you even write.
          </h1>

          {/* Centered Gray Description */}
          <p className="max-w-[44rem] mx-auto text-sm sm:text-base md:text-lg leading-relaxed text-center mt-6 px-4 font-normal text-slate-500">
            DocuFlow is a premium workspace for unified document management — complete with secure real-time collaboration, 256K context support, and automatic version synchronization in a single simplified architecture.
          </p>

          {/* Three Buttons Underneath */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 w-full max-w-lg px-4">
            {/* Primary Button */}
            <button
              onClick={() => onNewDoc()}
              className="w-full sm:w-auto px-5 py-3 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm shadow-xl min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10"
            >
              <span>Get Started</span>
              <span className="text-base font-normal leading-none mb-0.5">→</span>
            </button>

            {/* Import Button */}
            <button
              onClick={handleImportClick}
              className="w-full sm:w-auto px-5 py-3 border font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm min-h-[44px] bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600 shadow-xs hover:shadow-sm"
              title="Import PDF, Word, TXT, RTF, or Markdown file"
            >
              <UploadCloud className="w-4 h-4 text-blue-500" />
              <span>Import Document</span>
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => {
                const element = document.getElementById('documents-list-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full sm:w-auto px-5 py-3 border font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm min-h-[44px] bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
            >
              <span>View Documents</span>
            </button>
          </div>

          {/* Statistics Panel */}
          <div className="w-full max-w-4xl mt-20 sm:mt-28 px-4">
            <div className="rounded-[24px] border p-6 sm:py-8 sm:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative overflow-hidden bg-white border-slate-200 shadow-xs">
              
              {/* Statistic Column 1 */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900">
                  {documents.length || "12"}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                  Documents
                </span>
              </div>

              {/* Statistic Column 2 */}
              <div className="flex flex-col items-center justify-center text-center sm:border-l border-slate-100">
                <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900">
                  {formatWords(totalWords)}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                  Words Saved
                </span>
              </div>

              {/* Statistic Column 3 */}
              <div className="flex flex-col items-center justify-center text-center border-t pt-6 sm:border-t-0 sm:pt-0 lg:border-l border-slate-100">
                <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900">
                  100%
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                  Cloud Sync
                </span>
              </div>

              {/* Statistic Column 4 */}
              <div className="flex flex-col items-center justify-center text-center border-t pt-6 sm:border-t-0 sm:pt-0 sm:border-l border-slate-100">
                <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900">
                  256-bit
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                  Encryption
                </span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* 📂 DOCUMENT MANAGEMENT LIST SECTION */}
      <div id="documents-list-section" className="space-y-4 sm:space-y-6 pt-6 scroll-mt-6">
        
        {/* Page Heading & Controls */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 sm:pb-6 transition-colors ${theme === 'light' ? 'border-slate-200' : 'border-white/[0.05]'}`}>
          <div>
            <h2 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2.5 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <span>
                {activeTab === 'all' && 'Document Management'}
                {activeTab === 'recent' && 'Recent Documents'}
                {activeTab === 'starred' && 'Starred Documents'}
                {activeTab === 'trash' && 'Trash & Archive'}
                {selectedCategory && `Category: ${selectedCategory.toUpperCase()}`}
              </span>
              <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                theme === 'light'
                  ? 'text-blue-600 bg-blue-50 border-blue-200'
                  : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
              }`}>
                {sortedDocs.length}
              </span>
            </h2>
            <p className={`text-xs sm:text-sm mt-1 line-clamp-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Access, edit, and collaborate on your documents with instant cloud sync.
            </p>
          </div>

          {/* View Mode & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end shrink-0">
            {activeTab === 'trash' && sortedDocs.length > 0 && (
              <button
                onClick={() => {
                  setDeleteConfirm({ isAll: true });
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Empty Trash</span>
                <span className="sm:hidden">Empty</span>
              </button>
            )}

            {activeTab !== 'trash' && (
              <button
                onClick={handleImportClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl border border-blue-200 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                title="Import PDF, Word, TXT, RTF, or Markdown file"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                <span>Import</span>
              </button>
            )}

            {/* Sort Selector */}
            <div className={`flex items-center gap-1.5 sm:gap-2 border px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-white/[0.02] border-white/10 text-slate-300'
            }`}>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`bg-transparent font-medium focus:outline-none cursor-pointer text-xs ${
                  theme === 'light' ? 'text-slate-700' : 'text-slate-200'
                }`}
              >
                <option value="updated" className={theme === 'light' ? 'bg-white text-slate-800' : 'bg-[#0b0b0d] text-white'}>Sort: Modified</option>
                <option value="title" className={theme === 'light' ? 'bg-white text-slate-800' : 'bg-[#0b0b0d] text-white'}>Sort: Title (A-Z)</option>
                <option value="title-desc" className={theme === 'light' ? 'bg-white text-slate-800' : 'bg-[#0b0b0d] text-white'}>Sort: Title (Z-A)</option>
                <option value="words" className={theme === 'light' ? 'bg-white text-slate-800' : 'bg-[#0b0b0d] text-white'}>Sort: Word Count</option>
                <option value="created" className={theme === 'light' ? 'bg-white text-slate-800' : 'bg-[#0b0b0d] text-white'}>Sort: Created Date</option>
              </select>
            </div>

            {/* Toggle Grid/List */}
            <div className={`flex items-center border p-0.5 rounded-xl transition-colors ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? theme === 'light' ? 'bg-slate-200 text-slate-800 font-semibold' : 'bg-white/[0.05] text-white font-semibold' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'list' 
                    ? theme === 'light' ? 'bg-slate-200 text-slate-800 font-semibold' : 'bg-white/[0.05] text-white font-semibold' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Category Filter Bar */}
        {onSelectCategory && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1 hidden sm:flex">
              <Filter className="w-3.5 h-3.5" />
              Categories:
            </span>
            {categoryPills.map((pill) => {
              const isSelected = selectedCategory === pill.id;
              return (
                <button
                  key={pill.label}
                  onClick={() => onSelectCategory(isSelected && pill.id !== null ? null : pill.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                      : theme === 'light' 
                        ? 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800' 
                        : 'bg-white/[0.02] border border-white/5 text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  {pill.id && <span className={`w-2 h-2 rounded-full ${pill.color} shrink-0`} />}
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Error and Loading Banner for Import */}
        {importError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-2 shadow-xs mb-6 animate-in fade-in duration-200 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <span>{importError}</span>
            </div>
            <button
              onClick={() => setImportError(null)}
              className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-md hover:bg-red-100 transition-colors cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Document Grid / List */}
        {sortedDocs.length === 0 ? (
          <div className={`py-12 sm:py-16 text-center rounded-2xl border p-6 sm:p-8 transition-colors ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.01] border-white/[0.04]'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className={`text-base font-bold transition-colors ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery
                ? `No documents match "${searchQuery}". Try a different keyword.`
                : 'Create or import your first document to get started with DocuFlow.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNewDoc()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Document</span>
              </button>
              {activeTab !== 'trash' && (
                <button
                  onClick={handleImportClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer min-h-[44px] shadow-xs"
                >
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  <span>Import Document</span>
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {sortedDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onOpenDoc(doc.id)}
                className={`rounded-2xl border shadow-xs transition-all flex flex-col justify-between cursor-pointer group ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-300'
                    : 'bg-[#0b0b0d]/60 border-white/[0.04] hover:bg-[#121215]/80 hover:border-white/[0.08]'
                }`}
              >
                {/* Card Header */}
                <div className={`p-4 sm:p-5 border-b rounded-t-2xl transition-colors ${
                  theme === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-white/[0.03] bg-white/[0.01]'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                      <span className={`text-2xl p-2 rounded-xl border transition-all shrink-0 group-hover:scale-105 ${
                        theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.02] border-white/5'
                      }`}>
                        {doc.icon || '📄'}
                      </span>
                      <div className="flex-1 min-w-0">
                        {renamingDocId === doc.id ? (
                          <form onSubmit={(e) => handleSaveRename(doc.id, e)} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              autoFocus
                              value={renameTitle}
                              onChange={(e) => setRenameTitle(e.target.value)}
                              onBlur={(e) => handleSaveRename(doc.id, e)}
                              className={`text-sm font-bold border-b-2 border-blue-500 outline-none bg-transparent w-full ${
                                theme === 'light' ? 'text-slate-800' : 'text-white'
                              }`}
                            />
                          </form>
                        ) : (
                          <h3 className={`text-sm font-bold transition-colors truncate ${
                            theme === 'light' ? 'text-slate-800 group-hover:text-blue-600' : 'text-white group-hover:text-blue-400'
                          }`}>
                            {doc.title || 'Untitled Document'}
                          </h3>
                        )}
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDate(doc.updated_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleStar(doc.id, doc.is_starred)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          doc.is_starred
                            ? 'text-amber-500 hover:bg-amber-500/10'
                            : theme === 'light' 
                              ? 'text-slate-400 hover:text-amber-500 hover:bg-slate-100' 
                              : 'text-slate-500 hover:text-amber-500 hover:bg-white/[0.04]'
                        }`}
                        title={doc.is_starred ? 'Unstar' : 'Star'}
                      >
                        <Star className={`w-4 h-4 ${doc.is_starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menuOpenDocId === doc.id) {
                              setMenuOpenDocId(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            if (spaceBelow < 220) {
                              setMenuPosition('top');
                            } else {
                              setMenuPosition('bottom');
                            }
                            setMenuOpenDocId(doc.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            theme === 'light'
                              ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpenDocId === doc.id && (
                          <div className={`absolute right-0 ${menuPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} w-48 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 border ${
                            theme === 'light'
                              ? 'bg-white border-slate-200 text-slate-800'
                              : 'bg-[#0b0b0d] border-white/[0.05] text-slate-200'
                          }`}>
                            <button
                              onClick={(e) => handleStartRename(doc, e)}
                              className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center gap-2 font-medium cursor-pointer ${
                                theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.04]'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                              Rename Title
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenDocId(null);
                                setInfoDoc(doc);
                              }}
                              className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center gap-2 font-medium cursor-pointer ${
                                theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.04]'
                              }`}
                            >
                              <Info className="w-3.5 h-3.5 text-blue-500" />
                              Document Info
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenDocId(null);
                                onShareDoc(doc);
                              }}
                              className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center gap-2 font-medium cursor-pointer ${
                                theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.04]'
                              }`}
                            >
                              <Share2 className="w-3.5 h-3.5 text-slate-400" />
                              Share Link
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenDocId(null);
                                onDuplicateDoc(doc);
                              }}
                              className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center gap-2 font-medium cursor-pointer ${
                                theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.04]'
                              }`}
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              Duplicate Copy
                            </button>

                            <div className={`border-t my-1 ${theme === 'light' ? 'border-slate-100' : 'border-white/[0.04]'}`} />
                            
                            <button
                              onClick={() => {
                                setMenuOpenDocId(null);
                                exportMarkdown(doc);
                              }}
                              className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center gap-2 font-medium cursor-pointer ${
                                theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.04]'
                              }`}
                            >
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                              Export Markdown (.md)
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenDocId(null);
                                exportHTML(doc);
                              }}
                              className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center gap-2 font-medium cursor-pointer ${
                                theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.04]'
                              }`}
                            >
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                              Export HTML (.html)
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenDocId(null);
                                copyDocText(doc);
                              }}
                              className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center gap-2 font-medium cursor-pointer ${
                                theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.04]'
                              }`}
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              Copy Text
                            </button>

                            {doc.is_archived ? (
                              <>
                                <div className={`border-t my-1 ${theme === 'light' ? 'border-slate-100' : 'border-white/[0.04]'}`} />
                                <button
                                  onClick={() => {
                                    setMenuOpenDocId(null);
                                    onRestoreDoc(doc.id);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  Restore Document
                                </button>
                                <button
                                  onClick={() => {
                                    setMenuOpenDocId(null);
                                    setDeleteConfirm({ docId: doc.id });
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  Delete Permanently
                                </button>
                              </>
                            ) : (
                              <>
                                <div className={`border-t my-1 ${theme === 'light' ? 'border-slate-100' : 'border-white/[0.04]'}`} />
                                <button
                                  onClick={() => {
                                    setMenuOpenDocId(null);
                                    onDeleteDoc(doc.id, false);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  Move to Trash
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Snippet */}
                <div className="p-4 sm:p-5">
                  <p className={`text-xs line-clamp-3 leading-relaxed font-sans transition-colors ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {doc.content.replace(/<[^>]*>/g, ' ').trim() || 'Empty document...'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className={`px-4 sm:px-5 py-2.5 sm:py-3 border-t flex items-center justify-between text-[11px] rounded-b-2xl transition-colors ${
                  theme === 'light' 
                    ? 'bg-slate-50/50 border-slate-100 text-slate-500' 
                    : 'bg-white/[0.01] border-t border-white/[0.03] text-slate-400'
                }`}>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {settings?.showWordCount && (
                      <span className={`font-semibold transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                        {doc.word_count || 0} words
                      </span>
                    )}
                    {settings?.showWordCount && settings?.showReadingTime && <span className="text-slate-300">•</span>}
                    {settings?.showReadingTime && (
                      <span>~{Math.ceil((doc.word_count || 1) / 200)}m read</span>
                    )}
                    {doc.category && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight border border-blue-500/20">
                        {doc.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-medium">
                    {doc.access_level === 'private' && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    )}
                    {doc.access_level === 'shared' && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <Users className="w-3 h-3" /> Shared
                      </span>
                    )}
                    {(doc.access_level === 'public_read' || doc.access_level === 'public_edit') && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0b0b0d]/60 border-white/[0.04]'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className={`border-b text-xs font-semibold uppercase tracking-wider transition-colors ${
                    theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-white/[0.01] border-white/[0.04] text-slate-400'
                  }`}>
                    <th className="py-3 px-4 sm:px-5">Document Title</th>
                    <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Category</th>
                    <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Access</th>
                    {settings?.showWordCount && <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Word Count</th>}
                    <th className="py-3 px-3 sm:px-4">Last Modified</th>
                    <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs transition-colors ${
                  theme === 'light' ? 'divide-slate-100 text-slate-700' : 'divide-white/[0.03] text-slate-300'
                }`}>
                  {sortedDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => onOpenDoc(doc.id)}
                      className={`cursor-pointer transition-colors group ${
                        theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-white/[0.01]'
                      }`}
                    >
                      <td className={`py-3.5 px-4 sm:px-5 font-semibold transition-colors ${
                        theme === 'light' ? 'text-slate-800 group-hover:text-blue-600' : 'text-white group-hover:text-blue-400'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{doc.icon || '📄'}</span>
                          <span className="truncate max-w-[150px] sm:max-w-xs">{doc.title || 'Untitled Document'}</span>
                          {doc.is_starred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                      </td>
                      <td className={`py-3.5 px-3 sm:px-4 hidden sm:table-cell capitalize font-medium transition-colors ${
                        theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {doc.category || 'General'}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border transition-colors ${
                          theme === 'light' 
                            ? 'bg-slate-100 text-slate-700 border-slate-200' 
                            : 'bg-slate-800 text-slate-300 border-white/[0.05]'
                        }`}>
                          {doc.access_level}
                        </span>
                      </td>
                      {settings?.showWordCount && (
                        <td className={`py-3.5 px-3 sm:px-4 hidden lg:table-cell font-mono transition-colors ${
                          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {doc.word_count || 0}
                        </td>
                      )}
                      <td className={`py-3.5 px-3 sm:px-4 whitespace-nowrap transition-colors ${
                        theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {formatDate(doc.updated_at)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {doc.is_archived ? (
                            <>
                              <button
                                onClick={() => onRestoreDoc(doc.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                                title="Restore Document"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({ docId: doc.id });
                                }}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onShareDoc(doc)}
                                className={`p-1.5 text-slate-500 hover:text-blue-400 rounded-lg cursor-pointer transition-colors ${
                                  theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/[0.02]'
                                }`}
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteDoc(doc.id, false)}
                                className={`p-1.5 text-slate-500 hover:text-red-400 rounded-lg cursor-pointer transition-colors ${
                                  theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/[0.02]'
                                }`}
                                title="Move to Trash"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Hidden File Input for Document Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt,.rtf,.md"
        className="hidden"
      />

      {/* Premium Dynamic Loading Overlay */}
      {isImporting && (
        <div className="fixed inset-0 bg-white/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <UploadCloud className="w-6 h-6 text-blue-600 absolute animate-bounce" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-slate-800">Parsing & Importing Document...</p>
            <p className="text-xs text-slate-500 font-medium">Extracting formatting structure and converting to rich-text...</p>
          </div>
        </div>
      )}

      {/* Document Information & Metadata Modal */}
      {infoDoc && (
        <DocumentInfoModal
          isOpen={true}
          doc={infoDoc}
          onClose={() => setInfoDoc(null)}
          onShowToast={onShowToast}
        />
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-10 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 mb-5">
              {deleteConfirm.isAll 
                ? 'Permanently delete ALL items in trash? This action cannot be undone.'
                : 'Permanently delete this document? This action cannot be undone.'}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (deleteConfirm.isAll) {
                    sortedDocs.forEach(doc => onDeleteDoc(doc.id, true));
                  } else if (deleteConfirm.docId) {
                    onDeleteDoc(deleteConfirm.docId, true);
                  }
                  setDeleteConfirm(null);
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Permanently Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


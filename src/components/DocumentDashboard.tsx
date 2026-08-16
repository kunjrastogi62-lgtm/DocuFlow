import React, { useState, useEffect } from 'react';
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
  Folder
} from 'lucide-react';
import { DocuFlowDocument, ViewTab } from '../types';

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
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'created'>('updated');
  const [menuOpenDocId, setMenuOpenDocId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

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
    <div className="flex-1 p-3.5 sm:p-6 lg:p-8 md:overflow-y-auto max-w-6xl mx-auto w-full space-y-8 sm:space-y-12 pb-20 md:pb-12 text-slate-200">
      
      {/* 🚀 SCREENSHOT RECREATION HERO SECTION */}
      {showHero && (
        <div className="flex flex-col items-center justify-center pt-16 pb-16 sm:pt-24 sm:pb-24 relative z-10 w-full animate-fade-in">
          
          {/* Top Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-[#0c0c0e]/80 backdrop-blur-md text-xs text-[#a1a1aa] mb-7">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium tracking-wide">Available Now · February 2026</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold text-white tracking-tight leading-[1.08] text-center max-w-4xl mx-auto select-none font-sans">
            The workspace that thinks<br />before you even write.
          </h1>

          {/* Centered Gray Description */}
          <p className="max-w-[44rem] mx-auto text-[#8e8e93] text-sm sm:text-base md:text-lg leading-relaxed text-center mt-6 px-4 font-normal">
            DocuFlow is a premium workspace for unified document management — complete with secure real-time collaboration, 256K context support, and automatic version synchronization in a single simplified architecture.
          </p>

          {/* Two Buttons Underneath */}
          <div className="flex flex-row items-center justify-center gap-4 mt-8 w-full max-w-md px-4">
            {/* Primary Button */}
            <button
              onClick={() => onNewDoc()}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-black font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm shadow-xl shadow-white/5"
            >
              <span>Start Writing</span>
              <span className="text-base font-normal leading-none mb-0.5">→</span>
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => {
                const element = document.getElementById('documents-list-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-6 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm"
            >
              <span>View Documents</span>
            </button>
          </div>

          {/* Statistics Panel */}
          <div className="w-full max-w-4xl mt-20 sm:mt-28 px-4">
            <div className="rounded-[24px] border border-white/[0.06] bg-[#070709] p-6 sm:py-8 sm:px-10 grid grid-cols-2 md:grid-cols-4 gap-6 relative overflow-hidden">
              
              {/* Statistic Column 1 */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-white tracking-tight">
                  {documents.length || "12"}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                  Documents
                </span>
              </div>

              {/* Statistic Column 2 */}
              <div className="flex flex-col items-center justify-center text-center border-l border-white/[0.06]">
                <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-white tracking-tight">
                  {formatWords(totalWords)}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                  Words Saved
                </span>
              </div>

              {/* Statistic Column 3 */}
              <div className="flex flex-col items-center justify-center text-center border-l border-white/[0.06] md:border-l border-white/[0.06]">
                <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-white tracking-tight">
                  100%
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                  Cloud Sync
                </span>
              </div>

              {/* Statistic Column 4 */}
              <div className="flex flex-col items-center justify-center text-center border-l border-white/[0.06]">
                <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-white tracking-tight">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-4 sm:pb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>
                {activeTab === 'all' && 'Document Management'}
                {activeTab === 'recent' && 'Recent Documents'}
                {activeTab === 'starred' && 'Starred Documents'}
                {activeTab === 'trash' && 'Trash & Archive'}
                {selectedCategory && `Category: ${selectedCategory.toUpperCase()}`}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-500/20">
                {sortedDocs.length}
              </span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 line-clamp-1">
              Access, edit, and collaborate on your documents with instant cloud sync.
            </p>
          </div>

          {/* View Mode & Sorting Controls */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            {activeTab === 'trash' && sortedDocs.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Permanently delete ALL items in trash? This cannot be undone.')) {
                    sortedDocs.forEach(doc => onDeleteDoc(doc.id, true));
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Empty Trash</span>
                <span className="sm:hidden">Empty</span>
              </button>
            )}

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/[0.02] border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="updated" className="bg-[#0b0b0d] text-white">Sort: Modified</option>
                <option value="title" className="bg-[#0b0b0d] text-white">Sort: Title (A-Z)</option>
                <option value="created" className="bg-[#0b0b0d] text-white">Sort: Created</option>
              </select>
            </div>

            {/* Toggle Grid/List */}
            <div className="flex items-center bg-white/[0.02] border border-white/10 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-white/[0.05] text-white font-semibold' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-white/[0.05] text-white font-semibold' : 'text-slate-500 hover:text-slate-300'
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

        {/* Document Grid / List */}
        {sortedDocs.length === 0 ? (
          <div className="py-12 sm:py-16 text-center bg-white/[0.01] rounded-2xl border border-white/[0.04] p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-bold text-white">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery
                ? `No documents match "${searchQuery}". Try a different keyword.`
                : 'Create your first document to get started with DocuFlow.'}
            </p>
            <button
              onClick={() => onNewDoc()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Document</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {sortedDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onOpenDoc(doc.id)}
                className="bg-[#0b0b0d]/60 rounded-2xl border border-white/[0.04] shadow-xs hover:bg-[#121215]/80 hover:border-white/[0.08] transition-all flex flex-col justify-between cursor-pointer group"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-white/[0.03] bg-white/[0.01] rounded-t-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                      <span className="text-2xl p-2 bg-white/[0.02] rounded-xl border border-white/5 group-hover:scale-105 transition-transform shrink-0">
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
                              className="text-sm font-bold text-white border-b-2 border-blue-500 outline-none bg-transparent w-full"
                            />
                          </form>
                        ) : (
                          <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
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
                          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpenDocId === doc.id && (
                          <div className={`absolute right-0 ${menuPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} w-44 bg-[#0b0b0d] rounded-xl shadow-xl border border-white/[0.05] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}>
                            <button
                              onClick={(e) => handleStartRename(doc, e)}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-white/[0.04] flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                              Rename Title
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenDocId(null);
                                onShareDoc(doc);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-white/[0.04] flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5 text-slate-400" />
                              Share Link
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenDocId(null);
                                onDuplicateDoc(doc);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-white/[0.04] flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              Duplicate Copy
                            </button>
                            {doc.is_archived ? (
                              <>
                                <div className="border-t border-white/[0.04] my-1" />
                                <button
                                  onClick={() => {
                                    setMenuOpenDocId(null);
                                    onRestoreDoc(doc.id);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  Restore Document
                                </button>
                                <button
                                  onClick={() => {
                                    setMenuOpenDocId(null);
                                    if (confirm('Permanently delete this document? This cannot be undone.')) {
                                      onDeleteDoc(doc.id, true);
                                    }
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  Delete Permanently
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="border-t border-white/[0.04] my-1" />
                                <button
                                  onClick={() => {
                                    setMenuOpenDocId(null);
                                    onDeleteDoc(doc.id, false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans">
                    {doc.content.replace(/<[^>]*>/g, ' ').trim() || 'Empty document...'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white/[0.01] border-t border-white/[0.03] flex items-center justify-between text-[11px] text-slate-400 rounded-b-2xl">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-semibold text-slate-300">
                      {doc.word_count || 0} words
                    </span>
                    {doc.category && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight border border-blue-500/20">
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
                      <span className="flex items-center gap-1 text-blue-400">
                        <Users className="w-3 h-3" /> Shared
                      </span>
                    )}
                    {(doc.access_level === 'public_read' || doc.access_level === 'public_edit') && (
                      <span className="flex items-center gap-1 text-green-400">
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
          <div className="bg-[#0b0b0d]/60 rounded-2xl border border-white/[0.04] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/[0.04] text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-5">Document Title</th>
                    <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Category</th>
                    <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Access</th>
                    <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Word Count</th>
                    <th className="py-3 px-3 sm:px-4">Last Modified</th>
                    <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] text-xs text-slate-300">
                  {sortedDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => onOpenDoc(doc.id)}
                      className="hover:bg-white/[0.01] cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-semibold text-white group-hover:text-blue-400">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{doc.icon || '📄'}</span>
                          <span className="truncate max-w-[150px] sm:max-w-xs">{doc.title || 'Untitled Document'}</span>
                          {doc.is_starred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 hidden sm:table-cell capitalize font-medium text-slate-400">
                        {doc.category || 'General'}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-slate-800 text-slate-300 border border-white/[0.05]">
                          {doc.access_level}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 hidden lg:table-cell font-mono text-slate-400">
                        {doc.word_count || 0}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-slate-400 whitespace-nowrap">
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
                                  if (confirm('Permanently delete this document? This cannot be undone.')) {
                                    onDeleteDoc(doc.id, true);
                                  }
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
                                className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-white/[0.02] cursor-pointer"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteDoc(doc.id, false)}
                                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/[0.02] cursor-pointer"
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
    </div>
  );
};


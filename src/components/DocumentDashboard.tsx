import React, { useState } from 'react';
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
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

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

  return (
    <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 pb-20 md:pb-8">
      {/* Page Heading & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 pb-4 sm:pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 sm:gap-3">
            <span>
              {activeTab === 'all' && 'Document Management'}
              {activeTab === 'recent' && 'Recent Documents'}
              {activeTab === 'starred' && 'Starred Documents'}
              {activeTab === 'trash' && 'Trash & Archive'}
              {selectedCategory && `Category: ${selectedCategory.toUpperCase()}`}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {sortedDocs.length}
            </span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 line-clamp-1 sm:line-clamp-none">
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Empty Trash</span>
              <span className="sm:hidden">Empty</span>
            </button>
          )}

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="updated">Sort: Modified</option>
              <option value="title">Sort: Title (A-Z)</option>
              <option value="created">Sort: Created</option>
            </select>
          </div>

          {/* Toggle Grid/List */}
          <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Category Filter Bar (Touch friendly on mobile & desktop) */}
      {onSelectCategory && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1 hidden sm:flex">
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
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
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
        <div className="py-12 sm:py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <FileText className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No documents found</h3>
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
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <span className="text-2xl p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
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
                            className="text-sm font-bold text-slate-900 border-b-2 border-blue-600 outline-none bg-transparent w-full"
                          />
                        </form>
                      ) : (
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {doc.title || 'Untitled Document'}
                        </h3>
                      )}
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDate(doc.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleStar(doc.id, doc.is_starred)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        doc.is_starred
                          ? 'text-amber-500 hover:bg-amber-50'
                          : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                      }`}
                      title={doc.is_starred ? 'Unstar' : 'Star'}
                    >
                      <Star className={`w-4 h-4 ${doc.is_starred ? 'fill-amber-400' : ''}`} />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenDocId(menuOpenDocId === doc.id ? null : doc.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {menuOpenDocId === doc.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={(e) => handleStartRename(doc, e)}
                            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            Rename Title
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpenDocId(null);
                              onShareDoc(doc);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                          >
                            <Share2 className="w-3.5 h-3.5 text-slate-400" />
                            Share Link
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpenDocId(null);
                              onDuplicateDoc(doc);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            Duplicate Copy
                          </button>
                          {doc.is_archived ? (
                            <>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => {
                                  setMenuOpenDocId(null);
                                  onRestoreDoc(doc.id);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-medium"
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
                                className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                Delete Permanently
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => {
                                  setMenuOpenDocId(null);
                                  onDeleteDoc(doc.id, false);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
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
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">
                  {doc.content.replace(/<[^>]*>/g, ' ').trim() || 'Empty document...'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold text-slate-700">
                    {doc.word_count || 0} words
                  </span>
                  {doc.category && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                      {doc.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-medium">
                  {doc.access_level === 'private' && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  )}
                  {doc.access_level === 'shared' && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Users className="w-3 h-3" /> Shared
                    </span>
                  )}
                  {(doc.access_level === 'public_read' || doc.access_level === 'public_edit') && (
                    <span className="flex items-center gap-1 text-green-600">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-5">Document Title</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Category</th>
                  <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Access</th>
                  <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Word Count</th>
                  <th className="py-3 px-3 sm:px-4">Last Modified</th>
                  <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {sortedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onOpenDoc(doc.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 sm:px-5 font-semibold text-slate-900 group-hover:text-blue-600">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{doc.icon || '📄'}</span>
                        <span className="truncate max-w-[150px] sm:max-w-xs">{doc.title || 'Untitled Document'}</span>
                        {doc.is_starred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 hidden sm:table-cell capitalize font-medium text-slate-500">
                      {doc.category || 'General'}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600 border border-slate-200/60">
                        {doc.access_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 hidden lg:table-cell font-mono text-slate-500">
                      {doc.word_count || 0}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(doc.updated_at)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {doc.is_archived ? (
                          <>
                            <button
                              onClick={() => onRestoreDoc(doc.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
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
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onShareDoc(doc)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteDoc(doc.id, false)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
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
  );
};

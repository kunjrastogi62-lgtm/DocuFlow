import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  Star, 
  Trash2, 
  UploadCloud, 
  Sliders, 
  Keyboard, 
  Clock, 
  Folder, 
  X, 
  CornerDownLeft,
  ArrowRight
} from 'lucide-react';
import { DocuFlowDocument, ViewTab } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocuFlowDocument[];
  onOpenDoc: (docId: string) => void;
  onNewDoc: () => void;
  onImportDoc: () => void;
  onTabChange: (tab: ViewTab) => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  documents,
  onOpenDoc,
  onNewDoc,
  onImportDoc,
  onTabChange,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Built-in Actions
  const staticActions = [
    {
      id: 'action-new',
      type: 'action',
      title: 'Create New Document',
      subtitle: 'Start with a fresh blank canvas',
      icon: Plus,
      run: () => {
        onNewDoc();
        onClose();
      },
    },
    {
      id: 'action-import',
      type: 'action',
      title: 'Import Document',
      subtitle: 'Upload PDF, Word, TXT, RTF, or Markdown',
      icon: UploadCloud,
      run: () => {
        onImportDoc();
        onClose();
      },
    },
    {
      id: 'action-starred',
      type: 'navigation',
      title: 'View Starred Documents',
      subtitle: 'Quick access to your favorite files',
      icon: Star,
      run: () => {
        onTabChange('starred');
        onClose();
      },
    },
    {
      id: 'action-recent',
      type: 'navigation',
      title: 'View Recent Documents',
      subtitle: 'Documents edited in the last 7 days',
      icon: Clock,
      run: () => {
        onTabChange('recent');
        onClose();
      },
    },
    {
      id: 'action-settings',
      type: 'action',
      title: 'Open Settings & Preferences',
      subtitle: 'Customize typography, default categories, and layout',
      icon: Sliders,
      run: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: 'action-shortcuts',
      type: 'action',
      title: 'Keyboard Shortcuts Guide',
      subtitle: 'View all keyboard shortcuts and productivity tips',
      icon: Keyboard,
      run: () => {
        onOpenShortcuts();
        onClose();
      },
    },
  ];

  // Matched Documents
  const matchingDocs = documents
    .filter((d) => !d.is_archived)
    .filter((d) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q)
      );
    })
    .slice(0, 6)
    .map((d) => ({
      id: `doc-${d.id}`,
      type: 'document',
      title: d.title || 'Untitled Document',
      subtitle: `${d.word_count || 0} words • ${d.category || 'General'} • ${new Date(d.updated_at).toLocaleDateString()}`,
      icon: FileText,
      iconEmoji: d.icon || '📄',
      run: () => {
        onOpenDoc(d.id);
        onClose();
      },
    }));

  const filteredActions = staticActions.filter((a) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q);
  });

  const allItems = [...matchingDocs, ...filteredActions];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search documents..."
            className="flex-1 text-sm bg-transparent text-slate-800 placeholder-slate-400 outline-hidden font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching documents or commands found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {matchingDocs.length > 0 && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Documents
                </div>
              )}
              {allItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const IconComponent = item.icon;

                return (
                  <div
                    key={item.id}
                    onClick={item.run}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {'iconEmoji' in item && item.iconEmoji ? (
                          <span className="text-sm leading-none">{item.iconEmoji}</span>
                        ) : (
                          <IconComponent className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-blue-600 text-[10px] font-semibold shrink-0 pl-2">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-600">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-600">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-600">↵</kbd>
              Open
            </span>
          </div>
          <span className="font-medium text-slate-500">DocuFlow Quick Access</span>
        </div>
      </div>
    </div>
  );
};

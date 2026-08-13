import React from 'react';
import { 
  FileText, 
  Users, 
  Star, 
  Trash2, 
  LayoutTemplate, 
  Clock, 
  Folder,
  Database,
  Plus
} from 'lucide-react';
import { ViewTab } from '../types';

interface SidebarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  selectedCategory: string | null;
  onCategorySelect: (cat: string | null) => void;
  onNewDoc: () => void;
  docCounts: {
    all: number;
    starred: number;
    trash: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  selectedCategory,
  onCategorySelect,
  onNewDoc,
  docCounts,
}) => {
  const mainNavs = [
    { id: 'all' as ViewTab, label: 'All Documents', icon: FileText, count: docCounts.all },
    { id: 'recent' as ViewTab, label: 'Recent', icon: Clock, count: null },
    { id: 'starred' as ViewTab, label: 'Starred', icon: Star, count: docCounts.starred },
    { id: 'trash' as ViewTab, label: 'Trash / Archive', icon: Trash2, count: docCounts.trash },
  ];

  const categories = [
    { id: 'work', label: 'Work', color: 'bg-blue-500' },
    { id: 'project', label: 'Projects', color: 'bg-indigo-500' },
    { id: 'ideas', label: 'Ideas & Specs', color: 'bg-amber-500' },
    { id: 'personal', label: 'Personal', color: 'bg-emerald-500' },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0F172A] flex flex-col justify-between hidden md:flex text-slate-400 min-h-[calc(100vh-64px)] border-r border-slate-800/60">
      <div className="space-y-6">
        {/* Brand Bar inside Sidebar if needed / Quick Action */}
        <div className="p-4 border-b border-slate-800/50">
          <button
            onClick={onNewDoc}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Document</span>
          </button>
        </div>

        {/* Main Nav */}
        <div className="px-3 space-y-1 text-sm">
          <p className="pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Documents
          </p>
          {mainNavs.map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id && selectedCategory === null;
            return (
              <button
                key={nav.id}
                onClick={() => {
                  onCategorySelect(null);
                  onTabChange(nav.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{nav.label}</span>
                </div>
                {nav.count !== null && nav.count > 0 && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {nav.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="px-3 space-y-1 pt-2 border-t border-slate-800/50 text-sm">
          <p className="pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Categories
          </p>
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onTabChange('all');
                  onCategorySelect(isCatActive ? null : cat.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                  isCatActive
                    ? 'bg-slate-800 text-white font-medium border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                  <span>{cat.label}</span>
                </div>
                {isCatActive && <Folder className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">
            DF
          </div>
          <div>
            <p className="text-white text-xs font-medium">DocuFlow Pro</p>
            <p className="text-[10px] text-slate-500">v2.4.1-stable</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

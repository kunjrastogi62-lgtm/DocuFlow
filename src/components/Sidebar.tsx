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
  Plus,
  X,
  Layers,
  Sparkles
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
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  selectedCategory,
  onCategorySelect,
  onNewDoc,
  docCounts,
  isOpenOnMobile = false,
  onCloseMobile,
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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-5">
        {/* Mobile Header with Close Button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="DocuFlow" className="w-7 h-7 object-contain" />
            <span className="text-white font-bold text-base">DocuFlow Navigation</span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Action Button */}
        <div className="p-3 sm:p-4">
          <button
            onClick={() => {
              onNewDoc();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Document</span>
          </button>
        </div>

        {/* Main Nav Items */}
        <div className="px-3 space-y-1 text-sm">
          <p className="pb-1.5 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Documents
          </p>
          
          {/* Desktop/Tablet (Original Order) */}
          <div className="hidden md:flex flex-col space-y-1">
            {mainNavs.map((nav) => {
              const Icon = nav.icon;
              const isActive = activeTab === nav.id && selectedCategory === null;
              
              return (
                <button
                  key={`desktop-${nav.id}`}
                  onClick={() => {
                    onCategorySelect(null);
                    onTabChange(nav.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{nav.label}</span>
                  </div>
                  {nav.count !== null && nav.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {nav.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile (Trash moved to top) */}
          <div className="md:hidden flex flex-col space-y-1">
            {[mainNavs[0], mainNavs[3], mainNavs[1], mainNavs[2]].map((nav) => {
              const Icon = nav.icon;
              const isActive = activeTab === nav.id && selectedCategory === null;
              
              return (
                <button
                  key={`mobile-${nav.id}`}
                  onClick={() => {
                    onCategorySelect(null);
                    onTabChange(nav.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{nav.label}</span>
                  </div>
                  {nav.count !== null && nav.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {nav.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="px-3 space-y-1 pt-3 border-t border-white/[0.05] text-sm">
          <div className="flex items-center justify-between px-3 pb-1.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Categories
            </p>
            {selectedCategory && (
              <button
                onClick={() => {
                  onCategorySelect(null);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
              >
                Reset
              </button>
            )}
          </div>
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onTabChange('all');
                  onCategorySelect(isCatActive ? null : cat.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                  isCatActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                  <span>{cat.label}</span>
                </div>
                {isCatActive ? (
                  <Folder className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <span className="text-xs text-slate-600">→</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/[0.05] mt-auto">
        <div className="flex items-center gap-3 p-2 bg-[#0b0b0d] rounded-xl border border-white/[0.04]">
          <img 
            src="/logo.svg" 
            alt="DocuFlow Logo" 
            className="w-8 h-8 object-contain"
          />
          <div>
            <p className="text-white text-xs font-semibold flex items-center gap-1.5">
              <span>DocuFlow Cloud</span>
              <span className="px-1.5 py-0.2 bg-blue-600/30 text-blue-300 rounded text-[9px] font-mono">PRO</span>
            </p>
            <p className="text-[10px] text-slate-500">Real-time sync enabled</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 shrink-0 bg-[#050505]/95 flex-col justify-between hidden md:flex text-slate-400 min-h-[calc(100vh-64px)] border-r border-white/[0.04]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-out) */}
      {isOpenOnMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer Canvas */}
          <div className="relative w-4/5 max-w-xs bg-[#050505] text-slate-400 h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200 border-r border-white/[0.04]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

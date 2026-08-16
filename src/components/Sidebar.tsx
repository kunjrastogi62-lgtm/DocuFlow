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
  theme?: 'light' | 'dark';
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
  theme = 'light',
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
    <div className="flex flex-col justify-between h-full overflow-y-auto">
      <div className="space-y-5">
        {/* Mobile Header with Close Button */}
        <div 
          style={{ borderColor: 'var(--sidebar-border)' }}
          className="md:hidden flex items-center justify-between p-4 border-b"
        >
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="DocuFlow" className="w-7 h-7 object-contain" />
            <span 
              style={{ color: 'var(--sidebar-text-strong)' }}
              className="font-bold text-base"
            >
              DocuFlow Navigation
            </span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              style={{ color: 'var(--sidebar-icon)' }}
              className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)] transition-colors cursor-pointer"
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
          <p 
            style={{ color: 'var(--sidebar-heading)' }}
            className="pb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider"
          >
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
                  style={{
                    backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderColor: isActive ? 'var(--sidebar-active-border)' : 'transparent',
                    color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)'
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer border ${
                    isActive ? 'font-semibold' : 'hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      style={{ color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-icon)' }}
                      className="w-4 h-4 transition-colors" 
                    />
                    <span>{nav.label}</span>
                  </div>
                  {nav.count !== null && nav.count > 0 && (
                    <span 
                      style={{
                        backgroundColor: isActive ? 'var(--sidebar-active-border)' : 'var(--sidebar-badge-bg)',
                        color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-badge-text)'
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors"
                    >
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
                  style={{
                    backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderColor: isActive ? 'var(--sidebar-active-border)' : 'transparent',
                    color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)'
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer border ${
                    isActive ? 'font-semibold' : 'hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      style={{ color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-icon)' }}
                      className="w-4 h-4 transition-colors" 
                    />
                    <span>{nav.label}</span>
                  </div>
                  {nav.count !== null && nav.count > 0 && (
                    <span 
                      style={{
                        backgroundColor: isActive ? 'var(--sidebar-active-border)' : 'var(--sidebar-badge-bg)',
                        color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-badge-text)'
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors"
                    >
                      {nav.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div 
          style={{ borderColor: 'var(--sidebar-border)' }}
          className="px-3 space-y-1 pt-3 border-t text-sm"
        >
          <div className="flex items-center justify-between px-3 pb-1.5">
            <p 
              style={{ color: 'var(--sidebar-heading)' }}
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              Categories
            </p>
            {selectedCategory && (
              <button
                onClick={() => {
                  onCategorySelect(null);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="text-[10px] text-blue-500 hover:text-blue-400 font-semibold cursor-pointer"
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
                style={{
                  backgroundColor: isCatActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  borderColor: isCatActive ? 'var(--sidebar-active-border)' : 'transparent',
                  color: isCatActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)'
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer border ${
                  isCatActive ? 'font-semibold' : 'hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                  <span>{cat.label}</span>
                </div>
                {isCatActive ? (
                  <Folder 
                    style={{ color: 'var(--sidebar-active-text)' }}
                    className="w-3.5 h-3.5 transition-colors" 
                  />
                ) : (
                  <span 
                    style={{ color: 'var(--sidebar-icon)' }}
                    className="text-xs opacity-60"
                  >
                    →
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div 
        style={{ borderColor: 'var(--sidebar-border)' }}
        className="p-4 border-t mt-auto"
      >
        <div 
          style={{
            backgroundColor: 'var(--sidebar-badge-bg)',
            borderColor: 'var(--sidebar-border)'
          }}
          className="flex items-center gap-3 p-2 rounded-xl border transition-colors"
        >
          <img 
            src="/logo.svg" 
            alt="DocuFlow Logo" 
            className="w-8 h-8 object-contain"
          />
          <div>
            <p 
              style={{ color: 'var(--sidebar-text-strong)' }}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <span>DocuFlow Cloud</span>
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded text-[9px] font-mono font-bold">PRO</span>
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
      <aside 
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
          color: 'var(--sidebar-text)'
        }}
        className="w-64 shrink-0 flex-col justify-between hidden md:flex min-h-[calc(100vh-64px)] border-r transition-colors duration-300"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-out) */}
      {isOpenOnMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer Canvas */}
          <div 
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              borderColor: 'var(--sidebar-border)',
              color: 'var(--sidebar-text)'
            }}
            className="relative w-4/5 max-w-xs h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200 border-r transition-colors"
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

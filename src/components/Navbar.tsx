import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  User as UserIcon, 
  LogOut, 
  Database, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: any;
  profile: UserProfile | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewDocument: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onGoHome: () => void;
  onToggleMobileMenu?: () => void;
  isDbConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  profile,
  searchQuery,
  onSearchChange,
  onNewDocument,
  onOpenAuth,
  onSignOut,
  onGoHome,
  onToggleMobileMenu,
  isDbConnected = true,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="h-16 bg-[#050505]/70 border-b border-white/[0.04] backdrop-blur-md flex flex-col justify-center px-3 sm:px-6 lg:px-8 z-30 sticky top-0">
      <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onGoHome}
            className="flex-shrink-0 whitespace-nowrap flex items-center gap-2.5 text-left focus:outline-none group"
            title="DocuFlow Home"
          >
            <img 
              src="/logo.svg" 
              alt="DocuFlow Logo" 
              className="w-8 h-8 object-contain transition-transform group-hover:scale-105 shrink-0"
            />
            <span className="text-white font-bold text-base sm:text-lg tracking-tight group-hover:text-blue-400 transition-colors">
              DocuFlow
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 ml-3 pl-3 border-l border-white/[0.06]">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-slate-300 font-medium">Cloud Documents</span>
          </div>
        </div>

        {/* Center: Desktop Search Bar */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search documents by title or keywords..."
              className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-2 pl-9 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className={`flex-shrink-0 md:hidden p-2 rounded-xl transition-colors ${
              showMobileSearch || searchQuery 
                ? 'bg-white/[0.04] text-white' 
                : 'text-slate-400 hover:bg-white/[0.04]'
            }`}
            title="Search Documents"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* New Document Button */}
          <button
            onClick={onNewDocument}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Document</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* User Auth Profile */}
          {user ? (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.05]"
              >
                <img
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt="Avatar"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 object-cover border border-white/[0.08]"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0b0b0d] rounded-2xl shadow-xl border border-white/[0.05] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-white/[0.04]">
                    <p className="text-sm font-semibold text-white truncate">
                      {profile?.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    {profile?.username && (
                      <p className="text-xs font-semibold text-blue-400 truncate mt-0.5">
                        @{profile.username}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {user.email || profile?.email || ''}
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-950/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Expandable Drawer */}
      {showMobileSearch && (
        <div className="md:hidden pt-2 pb-1 border-t border-white/[0.04] mt-2 animate-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search documents by title or content..."
              className="w-full bg-[#0b0b0d] border border-white/[0.05] rounded-xl px-4 py-2 pl-9 pr-8 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setShowMobileSearch(false)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

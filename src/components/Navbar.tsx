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
  ChevronDown
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
  isDbConnected = true,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 text-left focus:outline-none group"
          title="DocuFlow Home"
        >
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl shadow-xs group-hover:bg-blue-700 transition-colors">
            D
          </div>
          <span className="text-slate-900 font-semibold text-lg tracking-tight group-hover:text-blue-600 transition-colors">
            DocuFlow
          </span>
        </button>

        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-400 ml-4 pl-4 border-l border-slate-200">
          <span>Workspace</span>
          <span>/</span>
          <span className="text-slate-900 font-medium">Cloud Documents</span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documents by title or keywords..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pl-9 text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* New Document Button */}
        <button
          onClick={onNewDocument}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Document</span>
        </button>

        {/* User Auth Profile */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <img
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full bg-slate-200 object-cover border border-slate-300"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {profile?.full_name || 'Kunj Rastogi'}
                  </p>
                  {profile?.username && (
                    <p className="text-xs font-semibold text-blue-600 truncate mt-0.5">
                      @{profile.username}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {user.email || profile?.email || 'kunjrastogi62@gmail.com'}
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            <UserIcon className="w-4 h-4 text-slate-500" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

import React from 'react';
import { X, Sliders, Type, BookOpen, User, Folder, Check, Sparkles } from 'lucide-react';
import { UserSettings, UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  profile: UserProfile | null;
  user: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  profile,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Settings & Preferences</h3>
              <p className="text-xs text-slate-400">Manage editor preferences and account details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* User Account Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Account Overview
            </h4>
            {user === null ? (
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-slate-200 text-slate-500 font-bold text-sm">
                  G
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    Guest User
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Guest workspace
                  </p>
                </div>
              </div>
            ) : !user ? (
               <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-slate-500 text-xs">
                 Loading account...
               </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-sm uppercase">
                    {(profile?.full_name || user?.email || 'U').charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {profile?.full_name || profile?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Editor Typography Defaults */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-slate-500" />
              Editor Typography
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Default Font</label>
                <select
                  value={settings.defaultFont}
                  onChange={(e) => onUpdateSettings({ defaultFont: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Inter, sans-serif">Inter (Clean Sans)</option>
                  <option value="'Playfair Display', serif">Playfair (Serif Editorial)</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono (Code)</option>
                  <option value="Arial, sans-serif">Arial (Standard)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Default Size</label>
                <select
                  value={settings.defaultFontSize}
                  onChange={(e) => onUpdateSettings({ defaultFontSize: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-100"
                >
                  <option value="14px">14px (Compact)</option>
                  <option value="16px">16px (Standard)</option>
                  <option value="18px">18px (Large & Comfortable)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Default Document Category */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-slate-500" />
              Organization
            </h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Default Category for New Documents</label>
              <select
                value={settings.defaultCategory}
                onChange={(e) => onUpdateSettings({ defaultCategory: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-100"
              >
                <option value="general">General</option>
                <option value="work">Work</option>
                <option value="project">Projects</option>
                <option value="ideas">Ideas & Specs</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>

          {/* Productivity Toggles */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              Metrics & Productivity
            </h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/60 transition-colors">
                <div className="pr-3">
                  <p className="text-xs font-semibold text-slate-800">Show Word & Character Counts</p>
                  <p className="text-[11px] text-slate-400">Display live word and character counters in editor and document cards</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showWordCount}
                  onChange={(e) => onUpdateSettings({ showWordCount: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/60 transition-colors">
                <div className="pr-3">
                  <p className="text-xs font-semibold text-slate-800">Show Estimated Reading Time</p>
                  <p className="text-[11px] text-slate-400">Display estimated reading time badges (e.g. 2 min read)</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showReadingTime}
                  onChange={(e) => onUpdateSettings({ showReadingTime: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Preferences saved automatically</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

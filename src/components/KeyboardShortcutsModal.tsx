import React from 'react';
import { X, Keyboard, Command, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups = [
    {
      category: 'General & Navigation',
      shortcuts: [
        { label: 'Open Command Palette', keys: [`${modKey}`, 'K'] },
        { label: 'Save Document (Explicit Save)', keys: [`${modKey}`, 'S'] },
        { label: 'Find in Document', keys: [`${modKey}`, 'F'] },
        { label: 'Close / Cancel / Dismiss', keys: ['Esc'] },
      ],
    },
    {
      category: 'Text Formatting',
      shortcuts: [
        { label: 'Bold Text', keys: [`${modKey}`, 'B'] },
        { label: 'Italic Text', keys: [`${modKey}`, 'I'] },
        { label: 'Underline Text', keys: [`${modKey}`, 'U'] },
        { label: 'Undo Last Action', keys: [`${modKey}`, 'Z'] },
        { label: 'Redo Last Action', keys: [`${modKey}`, 'Y'] },
      ],
    },
    {
      category: 'Document Productivity',
      shortcuts: [
        { label: 'Print / PDF Export', keys: [`${modKey}`, 'P'] },
        { label: 'Copy Selection', keys: [`${modKey}`, 'C'] },
        { label: 'Paste Content', keys: [`${modKey}`, 'V'] },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-400">Boost your writing workflow speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                {group.category}
              </h4>
              <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs text-slate-700"
                  >
                    <span className="font-medium">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-md font-mono text-[11px] font-bold shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Esc</kbd> to dismiss anytime</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

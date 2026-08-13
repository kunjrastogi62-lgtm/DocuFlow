import React, { useState } from 'react';
import { History, Plus, RotateCcw, X, Clock, Check } from 'lucide-react';
import { DocumentVersion } from '../types';

interface VersionHistoryPanelProps {
  versions: DocumentVersion[];
  onCreateVersion: (name: string) => void;
  onRestoreVersion: (version: DocumentVersion) => void;
  onClose: () => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  versions,
  onCreateVersion,
  onRestoreVersion,
  onClose,
}) => {
  const [newVersionName, setNewVersionName] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionName.trim()) return;
    onCreateVersion(newVersionName.trim());
    setNewVersionName('');
  };

  return (
    <aside className="w-80 shrink-0 bg-white border-l border-slate-200/80 p-4 flex flex-col justify-between h-full shadow-lg z-20">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Version History</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Manual Version Snapshot */}
        <form onSubmit={handleCreate} className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Save Current Revision Snapshot
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="e.g., Final Draft v1.2"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-hidden"
            />
            <button
              type="submit"
              disabled={!newVersionName.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl disabled:opacity-50 transition-colors shrink-0"
            >
              Save
            </button>
          </div>
        </form>

        {/* Timeline */}
        <div className="space-y-2.5 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No version snapshots saved yet. Create a snapshot above to save an exact state of your document.
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.id}
                onClick={() => setSelectedVersionId(ver.id)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  selectedVersionId === ver.id
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{ver.version_name}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ver.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {ver.content.replace(/<[^>]*>/g, ' ')}
                </p>

                <div className="mt-2.5 flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreVersion(ver);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold rounded-lg text-[10px] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore This Version</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
        All versions saved to Supabase
      </div>
    </aside>
  );
};

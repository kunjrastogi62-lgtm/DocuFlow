import React, { useState } from 'react';
import { X, Share2, Copy, Check, Globe, Lock, Users, Mail, Shield, UserCheck } from 'lucide-react';
import { DocuFlowDocument, DocumentPermission } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  doc: DocuFlowDocument | null;
  onClose: () => void;
  onUpdateAccess: (accessLevel: DocuFlowDocument['access_level']) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  doc,
  onClose,
  onUpdateAccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit' | 'comment'>('edit');
  const [collaborators, setCollaborators] = useState<DocumentPermission[]>([
    { document_id: doc?.id || '', user_email: doc?.owner_email || 'owner@docuflow.app', permission: 'edit' }
  ]);

  if (!isOpen || !doc) return null;

  const shareUrl = `${window.location.origin}/?doc=${doc.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setCollaborators([
      ...collaborators,
      { document_id: doc.id, user_email: inviteEmail.trim(), permission: invitePermission }
    ]);
    setInviteEmail('');
    if (doc.access_level === 'private') {
      onUpdateAccess('shared');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">Share "{doc.title}"</h3>
              <p className="text-xs text-slate-500">Manage access permissions and share link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* General Access Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              General Access
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateAccess('private')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  doc.access_level === 'private'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-bold">Restricted / Private</span>
                  <span className="block text-[11px] text-slate-500">Only invited users can access</span>
                </div>
              </button>

              <button
                onClick={() => onUpdateAccess('public_edit')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  doc.access_level === 'public_edit' || doc.access_level === 'public_read'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-100 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-emerald-950">Anyone with link</span>
                  <span className="block text-[11px] text-slate-500">Can view & collaborate</span>
                </div>
              </button>
            </div>
          </div>

          {/* Copy Link Bar */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Shareable Document Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-700 outline-hidden"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Invite Collaborators */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Invite Collaborator by Email
            </label>
            <form onSubmit={handleAddCollaborator} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>

              <select
                value={invitePermission}
                onChange={(e) => setInvitePermission(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="edit">Can Edit</option>
                <option value="comment">Can Comment</option>
                <option value="view">Can View</option>
              </select>

              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors shrink-0"
              >
                Invite
              </button>
            </form>

            {/* List of People with access */}
            <div className="mt-4 space-y-2 max-h-36 overflow-y-auto pr-1">
              {collaborators.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs text-slate-800">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold">{c.user_email}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                    {c.permission}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

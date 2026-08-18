import React from 'react';
import { 
  X, 
  Info, 
  FileText, 
  Clock, 
  Calendar, 
  User, 
  Lock, 
  Globe, 
  Download, 
  Copy, 
  Check, 
  Tag, 
  BookOpen 
} from 'lucide-react';
import { DocuFlowDocument } from '../types';

interface DocumentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocuFlowDocument | null;
  onExportMarkdown: (doc: DocuFlowDocument) => void;
  onExportHTML: (doc: DocuFlowDocument) => void;
  onExportText: (doc: DocuFlowDocument) => void;
  onCopyContent: (doc: DocuFlowDocument) => void;
}

export const DocumentInfoModal: React.FC<DocumentInfoModalProps> = ({
  isOpen,
  onClose,
  doc,
  onExportMarkdown,
  onExportHTML,
  onExportText,
  onCopyContent,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !doc) return null;

  const readingTimeMin = Math.max(1, Math.ceil((doc.word_count || 1) / 200));

  const handleCopy = () => {
    onCopyContent(doc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{doc.icon || '📄'}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-xs">
                {doc.title || 'Untitled Document'}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {doc.category || 'General'} Document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Length
              </span>
              <p className="text-sm font-bold text-slate-900">
                {doc.word_count || 0} <span className="text-xs font-normal text-slate-500">words</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {doc.char_count || 0} characters
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Reading Time
              </span>
              <p className="text-sm font-bold text-slate-900">
                ~{readingTimeMin} <span className="text-xs font-normal text-slate-500">min read</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Standard 200 WPM
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Created
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {new Date(doc.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Last Modified
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {new Date(doc.updated_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(doc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Access & Status */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Owner / Author
              </span>
              <span className="font-semibold text-slate-800">
                {doc.user_email || 'You'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                {doc.access_level === 'private' ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                )}
                Access Level
              </span>
              <span className="font-semibold capitalize text-slate-800">
                {doc.access_level.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Quick Export / Actions */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-2">
              Export & Sharing
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onExportMarkdown(doc)}
                className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl font-medium text-slate-700 transition-colors flex flex-col items-center gap-1.5 cursor-pointer text-center"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Markdown</span>
              </button>
              <button
                onClick={() => onExportHTML(doc)}
                className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl font-medium text-slate-700 transition-colors flex flex-col items-center gap-1.5 cursor-pointer text-center"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>HTML</span>
              </button>
              <button
                onClick={() => onExportText(doc)}
                className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl font-medium text-slate-700 transition-colors flex flex-col items-center gap-1.5 cursor-pointer text-center"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Plain Text</span>
              </button>
              <button
                onClick={handleCopy}
                className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl font-medium text-slate-700 transition-colors flex flex-col items-center gap-1.5 cursor-pointer text-center"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

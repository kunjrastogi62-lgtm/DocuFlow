import React, { useState } from 'react';
import { X, Database, Copy, Check, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config';
import { DOCUFLOW_SUPABASE_SQL } from '../lib/sqlSchema';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSetupModal: React.FC<SqlSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(DOCUFLOW_SUPABASE_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Database Configuration</h3>
              <p className="text-xs text-slate-400">Connect your DocuFlow instance to your Supabase project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Badge */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-lg shadow-2xs">
              ⚡
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Supabase Client Active</p>
              <p className="text-xs text-slate-500">Connection established via publishable API key</p>
            </div>
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1 uppercase tracking-widest bg-green-100 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Operational
            </span>
          </div>

          {/* Credentials Display */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Project Credentials</h4>
              <p className="text-xs text-slate-500 mt-0.5">Found in your Supabase Project Settings under the API tab.</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Supabase Project URL</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={SUPABASE_URL}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-700 font-mono text-xs focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">Verified</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Supabase Publishable Key</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={SUPABASE_PUBLISHABLE_KEY}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-700 font-mono text-xs focus:outline-none truncate"
                  />
                  <div className="absolute right-3 top-2 flex gap-2">
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">Anon Key</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-600 font-medium">⚠️ Do NOT use the Supabase Service Role key here.</p>
              </div>
            </div>
          </div>

          {/* SQL Setup Script Helper */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Database Schema & Table Setup Script
                </h4>
                <p className="text-[11px] text-slate-500">
                  Creates <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">documents</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">comments</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">profiles</code>, and RLS policies.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded shadow-2xs transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Script</span>
                  </>
                )}
              </button>
            </div>

            {/* SQL Preview Box */}
            <pre className="bg-[#0F172A] text-slate-300 p-4 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
              {DOCUFLOW_SUPABASE_SQL}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Supabase Dashboard</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
            case 'error':
              return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
            default:
              return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
          }
        };

        const getBorderColor = () => {
          switch (toast.type) {
            case 'success':
              return 'border-emerald-200 bg-white/95 text-slate-800';
            case 'error':
              return 'border-rose-200 bg-white/95 text-slate-800';
            case 'warning':
              return 'border-amber-200 bg-white/95 text-slate-800';
            default:
              return 'border-blue-200 bg-white/95 text-slate-800';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200 text-xs sm:text-sm font-medium ${getBorderColor()}`}
            role="alert"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {getIcon()}
              <span className="truncate">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    onDismiss(toast.id);
                  }}
                  className="px-2 py-0.5 font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

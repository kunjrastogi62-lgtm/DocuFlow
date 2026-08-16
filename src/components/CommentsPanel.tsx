import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Send, X, CornerDownRight, Check } from 'lucide-react';
import { DocumentComment } from '../types';

interface CommentsPanelProps {
  comments: DocumentComment[];
  selectedText?: string;
  onAddComment: (text: string, highlightedText?: string) => void;
  onResolveComment: (commentId: string, resolved: boolean) => void;
  onClose: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  selectedText,
  onAddComment,
  onResolveComment,
  onClose,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim(), selectedText);
    setNewCommentText('');
  };

  const filteredComments = comments.filter((c) => showResolved ? true : !c.resolved);

  return (
    <aside className="w-full h-full bg-white border-l border-slate-200/80 p-4 flex flex-col justify-between shadow-lg z-20">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Document Comments</h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {comments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Quote Banner if user highlighted text */}
        {selectedText && (
          <div className="mb-4 p-2.5 bg-blue-50/80 border border-blue-200/60 rounded-xl text-xs text-blue-900">
            <span className="font-semibold block text-[10px] uppercase text-blue-600 mb-0.5">
              Commenting on Selection:
            </span>
            <p className="italic line-clamp-2">"{selectedText}"</p>
          </div>
        )}

        {/* Toggle Resolved */}
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
          <span>{filteredComments.length} {showResolved ? 'Total' : 'Open'} Threads</span>
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[11px]">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Show Resolved</span>
          </label>
        </div>

        {/* Comment Thread List */}
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No comments yet. Select text in the document and add a comment!
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  comment.resolved
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200/90 shadow-xs hover:border-blue-300'
                }`}
              >
                {comment.highlighted_text && (
                  <div className="mb-2 pl-2 border-l-2 border-amber-400 text-[11px] text-slate-600 italic line-clamp-2">
                    "{comment.highlighted_text}"
                  </div>
                )}

                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={comment.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_name}`}
                      alt="User"
                      className="w-5 h-5 rounded-full bg-slate-200"
                    />
                    <span className="font-bold text-slate-900">{comment.user_name}</span>
                  </div>
                  <button
                    onClick={() => onResolveComment(comment.id, !comment.resolved)}
                    className={`p-1 rounded-md transition-colors ${
                      comment.resolved
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-300 hover:text-emerald-600 hover:bg-slate-100'
                    }`}
                    title={comment.resolved ? 'Mark Unresolved' : 'Resolve Thread'}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-slate-700 leading-relaxed font-normal">{comment.text}</p>
                <span className="text-[10px] text-slate-400 block mt-1.5">
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Comment Input Form */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 disabled:text-slate-300 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};

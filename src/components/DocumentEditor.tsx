import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Share2, 
  History, 
  MessageSquare, 
  CheckCircle2, 
  Download, 
  Printer, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  FileCode,
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Table, 
  Image as ImageIcon, 
  Highlighter, 
  Type, 
  ChevronDown, 
  Plus, 
  FileText, 
  BookOpen, 
  Sparkles, 
  Lock, 
  Globe, 
  Users, 
  Quote, 
  Minus, 
  Info,
  Undo,
  Redo,
  Save,
  MoreVertical,
  Camera,
  X,
  Search,
  Replace,
  Copy,
  Check,
  Tag,
  Smile,
  AlertTriangle
} from 'lucide-react';
import { DocuFlowDocument, DocumentComment, DocumentVersion } from '../types';
import { CommentsPanel } from './CommentsPanel';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { ShareModal } from './ShareModal';

interface DocumentEditorProps {
  doc: DocuFlowDocument;
  onGoBack: () => void;
  onUpdateDocument: (docId: string, updates: Partial<DocuFlowDocument>) => void;
  onSaveDocument: (docId: string, title: string, content: string) => Promise<boolean>;
  comments: DocumentComment[];
  onAddComment: (text: string, highlightedText?: string) => void;
  onResolveComment: (commentId: string, resolved: boolean) => void;
  versions: DocumentVersion[];
  onCreateVersion: (name: string) => void;
  onRestoreVersion: (version: DocumentVersion) => void;
  isSaving?: boolean;
  theme?: 'light' | 'dark';
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  doc,
  onGoBack,
  onUpdateDocument,
  onSaveDocument,
  comments,
  onAddComment,
  onResolveComment,
  versions,
  onCreateVersion,
  onRestoreVersion,
  isSaving = false,
  theme = 'light',
  onShowToast,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLElement>(null);
  const [title, setTitle] = useState(doc.title);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'comments' | 'versions'>('editor');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState('16px');
  const [activeHeading, setActiveHeading] = useState('p');
  const [textColor, setTextColor] = useState('#0f172a');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [showOutline, setShowOutline] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  const [showSourceCode, setShowSourceCode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [showMobileFileMenu, setShowMobileFileMenu] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // In-editor Find & Replace
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  // Live stats calculation
  const [liveWordCount, setLiveWordCount] = useState(doc.word_count || 0);
  const [liveCharCount, setLiveCharCount] = useState(doc.char_count || 0);

  const calculateLiveStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    setLiveWordCount(words);
    setLiveCharCount(chars);
  };

  const readingTimeMin = useMemo(() => {
    return Math.max(1, Math.ceil((liveWordCount || 1) / 200));
  }, [liveWordCount]);

  const estimatedPages = useMemo(() => {
    return Math.max(1, Math.ceil((liveWordCount || 1) / 450));
  }, [liveWordCount]);

  // Keep typing caret within visible viewport without sudden jumping
  const keepCaretInView = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !scrollViewportRef.current) return;
    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const viewportRect = scrollViewportRef.current.getBoundingClientRect();

      if (rect.bottom > viewportRect.bottom - 90) {
        scrollViewportRef.current.scrollBy({ top: rect.bottom - (viewportRect.bottom - 90), behavior: 'smooth' });
      } else if (rect.top > 0 && rect.top < viewportRect.top + 80) {
        scrollViewportRef.current.scrollBy({ top: rect.top - (viewportRect.top + 80), behavior: 'smooth' });
      }
    } catch {
      // Ignore if range is detached
    }
  };

  const availableIcons = ['📄', '📝', '🚀', '💡', '📊', '🎯', '📑', '🛠️', '📌', '📚', '✍️', '💼', '⚡', '🌟', '📋'];
  const categoriesList: Array<{ id: DocuFlowDocument['category']; label: string; color: string }> = [
    { id: 'general', label: 'General', color: 'bg-slate-400' },
    { id: 'work', label: 'Work', color: 'bg-blue-500' },
    { id: 'project', label: 'Project', color: 'bg-indigo-500' },
    { id: 'ideas', label: 'Ideas & Specs', color: 'bg-amber-500' },
    { id: 'personal', label: 'Personal', color: 'bg-emerald-500' },
  ];

  // Leave warning when browser tab closed/refreshed
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Standard browser dialog
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Global Keyboard Shortcuts (Ctrl+S / Cmd+S for explicit save, Ctrl+F / Cmd+F for find)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleManualSave();
      } else if (isCmdOrCtrl && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setShowFindReplace((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, sourceHtml, hasUnsavedChanges, doc.id]);

  // Handle go back with confirmation prompt
  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      return;
    }
    onGoBack();
  };

  const handleManualSave = async () => {
    const currentContent = showSourceCode ? sourceHtml : (editorRef.current?.innerHTML || doc.content);
    const success = await onSaveDocument(doc.id, title, currentContent);
    if (success) {
      setHasUnsavedChanges(false);
      setJustSaved(true);
      if (onShowToast) onShowToast('Document saved successfully!', 'success');
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  // Update editor innerHTML when doc changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== doc.content) {
      editorRef.current.innerHTML = doc.content || '<p>Start typing here...</p>';
      updateHeadingsOutline();
      calculateLiveStats();
    }
    setTitle(doc.title);
    setHasUnsavedChanges(false);
  }, [doc.id]);

  // Handle title edit locally in state and update parent memory
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
    onUpdateDocument(doc.id, { title: newTitle });
  };

  // Content input handler locally in state and update parent memory
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHasUnsavedChanges(true);
      onUpdateDocument(doc.id, { content: html });
      updateHeadingsOutline();
      calculateLiveStats();
      keepCaretInView();
    }
  };

  const toggleSourceMode = () => {
    if (!showSourceCode) {
      // Entering Source Mode: store current innerHTML
      const currentHtml = editorRef.current?.innerHTML || doc.content || '';
      setSourceHtml(currentHtml);
      setShowSourceCode(true);
    } else {
      // Exiting Source Mode: apply sourceHtml to document
      setShowSourceCode(false);
      setHasUnsavedChanges(true);
      onUpdateDocument(doc.id, { content: sourceHtml });
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = sourceHtml;
          updateHeadingsOutline();
          calculateLiveStats();
        }
      }, 50);
    }
  };

  // Find and Replace logic
  const handleFind = () => {
    if (!findQuery.trim() || !editorRef.current) {
      setMatchCount(0);
      return;
    }
    const text = editorRef.current.innerText || '';
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    setMatchCount(matches ? matches.length : 0);
  };

  const handleReplaceAll = () => {
    if (!findQuery.trim() || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newHtml = currentHtml.replace(regex, replaceQuery);
    editorRef.current.innerHTML = newHtml;
    handleEditorInput();
    setMatchCount(0);
    if (onShowToast) onShowToast(`Replaced occurrences with "${replaceQuery}"`, 'info');
  };

  // Wrapper for version restoration to update local editor state and set unsaved changes
  const handleRestoreVersionWrapper = (version: DocumentVersion) => {
    onRestoreVersion(version);
    setHasUnsavedChanges(true);
    if (editorRef.current) {
      editorRef.current.innerHTML = version.content;
      updateHeadingsOutline();
      calculateLiveStats();
    }
  };

  // Track selection for inline commenting and keep caret in view
  const handleSelectionChange = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      setSelectedText(sel.toString().trim());
    }
    keepCaretInView();
  };

  // Extract headings for outline sidebar
  const updateHeadingsOutline = () => {
    if (!editorRef.current) return;
    const elements = editorRef.current.querySelectorAll('h1, h2, h3');
    const list: { id: string; text: string; level: number }[] = [];
    elements.forEach((el, index) => {
      const id = el.id || `heading-${index}`;
      el.id = id;
      list.push({
        id,
        text: el.textContent || `Heading ${index + 1}`,
        level: el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3,
      });
    });
    setHeadings(list);
  };

  // Formatting commands
  const execCmd = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    handleEditorInput();
  };

  const applyFormatBlock = (tag: string) => {
    setActiveHeading(tag);
    execCmd('formatBlock', tag);
  };

  const insertBlockHTML = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    let currentBlock: HTMLElement | null = null;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let node: Node | null = range.commonAncestorContainer;
      if (node && node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      if (node && node instanceof HTMLElement) {
        currentBlock = node.closest('h1, h2, h3, h4, h5, h6, p, li, pre, .callout-box, table, blockquote, div');
      }
    }

    // Create wrapper element from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    const newNodes = Array.from(tempDiv.childNodes);

    if (currentBlock && editorRef.current.contains(currentBlock) && currentBlock !== editorRef.current) {
      const parent = currentBlock.parentNode;
      if (parent) {
        let referenceNode = currentBlock.nextSibling;
        newNodes.forEach((node) => {
          parent.insertBefore(node, referenceNode);
        });
        handleEditorInput();
        return;
      }
    }

    // Fallback: Append to end of editor canvas
    newNodes.forEach((node) => {
      editorRef.current?.appendChild(node);
    });
    handleEditorInput();
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #cbd5e1; padding:8px;">Header 1</th>
            <th style="border:1px solid #cbd5e1; padding:8px;">Header 2</th>
            <th style="border:1px solid #cbd5e1; padding:8px;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:8px;">Cell 1</td>
            <td style="border:1px solid #cbd5e1; padding:8px;">Cell 2</td>
            <td style="border:1px solid #cbd5e1; padding:8px;">Cell 3</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    insertBlockHTML(tableHtml);
  };

  const insertImage = () => {
    const url = prompt('Enter Image URL:', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop');
    if (url) {
      const imgHtml = `<p><img src="${url}" alt="Document Image" style="max-width:100%; height:auto; border-radius:12px; margin:16px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" /></p>`;
      insertBlockHTML(imgHtml);
    }
  };

  const insertCallout = () => {
    const calloutHtml = `
      <div class="callout-box" style="background:#f0f9ff; border-left:4px solid #0284c7; padding:12px; border-radius:8px; margin:16px 0;">
        <strong>💡 Note:</strong> Enter callout message here...
      </div>
      <p><br></p>
    `;
    insertBlockHTML(calloutHtml);
  };

  // Export functions
  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Exported ${filename}`, 'success');
  };

  const exportAsMarkdown = () => {
    const text = doc.content
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<[^>]*>/g, '');
    downloadFile(`${doc.title || 'document'}.md`, text, 'text/markdown');
  };

  const exportAsHTML = () => {
    const fullHtml = `<!DOCTYPE html><html><head><title>${doc.title}</title><meta charset="utf-8"/><style>body{font-family:sans-serif; max-width:800px; margin:40px auto; padding:20px; line-height:1.6;}</style></head><body>${doc.content}</body></html>`;
    downloadFile(`${doc.title || 'document'}.html`, fullHtml, 'text/html');
  };

  const exportAsPlainText = () => {
    const plain = (editorRef.current?.innerText || doc.content.replace(/<[^>]*>/g, ' ')).trim();
    downloadFile(`${doc.title || 'document'}.txt`, plain, 'text/plain');
  };

  const copyToClipboard = () => {
    const plain = (editorRef.current?.innerText || doc.content.replace(/<[^>]*>/g, ' ')).trim();
    navigator.clipboard.writeText(plain);
    if (onShowToast) onShowToast('Document text copied to clipboard!', 'info');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden relative">
      {/* Top Navigation & Menu Bar */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 z-20 shadow-xs">
        {/* Left: Back button & Title input */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={handleGoBack}
            className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            {/* Icon Picker Popover */}
            <div className="relative">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="text-xl sm:text-2xl shrink-0 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Change Document Icon"
              >
                {doc.icon || '📄'}
              </button>

              {showIconPicker && (
                <div className="absolute left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-slate-200 grid grid-cols-5 gap-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {availableIcons.map((ico) => (
                    <button
                      key={ico}
                      onClick={() => {
                        onUpdateDocument(doc.id, { icon: ico });
                        setShowIconPicker(false);
                      }}
                      className="p-2 text-lg hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled Document"
                  className="text-sm sm:text-base font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 rounded-lg px-1.5 sm:px-2 py-0.5 outline-hidden transition-all w-full max-w-[140px] sm:max-w-xs md:max-w-md truncate"
                />

                {/* Category Pill / Dropdown in Header */}
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-slate-200/70 text-slate-700 transition-colors cursor-pointer"
                    title="Change Category"
                  >
                    <span className={`w-2 h-2 rounded-full ${categoriesList.find(c => c.id === doc.category)?.color || 'bg-slate-400'}`} />
                    <span className="capitalize">{doc.category || 'general'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showCategoryMenu && (
                    <div className="absolute left-0 mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      {categoriesList.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onUpdateDocument(doc.id, { category: cat.id });
                            setShowCategoryMenu(false);
                            if (onShowToast) onShowToast(`Category updated to ${cat.label}`, 'info');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer"
                        >
                          <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Desktop File Menu Options */}
              <div className="hidden md:flex items-center gap-2.5 text-xs text-slate-500 px-2 mt-0.5">
                <button
                  onClick={handleManualSave}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Save Now (⌘S)
                </button>
                <span>•</span>
                <button
                  onClick={() => setShowFindReplace(!showFindReplace)}
                  className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Search className="w-3 h-3" />
                  Find & Replace
                </button>
                <span>•</span>
                <button
                  onClick={() => onCreateVersion(`Snapshot - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Save Snapshot
                </button>
                <span>•</span>
                <button onClick={exportAsMarkdown} className="hover:text-blue-600 transition-colors cursor-pointer">
                  Export MD
                </button>
                <span>•</span>
                <button onClick={exportAsPlainText} className="hover:text-blue-600 transition-colors cursor-pointer">
                  Plain Text
                </button>
                <span>•</span>
                <button onClick={copyToClipboard} className="hover:text-blue-600 transition-colors cursor-pointer">
                  Copy Text
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions, Panels, and Tools */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Save Button */}
          <button
            onClick={handleManualSave}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              justSaved 
                ? 'bg-emerald-700 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
            }`}
            title="Save Changes (Ctrl+S / Cmd+S)"
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{justSaved ? 'Saved!' : 'Save'}</span>
          </button>

          {/* Save Status & Live Metrics on Desktop */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-xl text-xs font-medium border border-slate-200 text-slate-600">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Saving...</span>
              </span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved changes</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved</span>
              </span>
            )}
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-normal">
              {liveWordCount} words • ~{readingTimeMin} min read
            </span>
          </div>

          {/* Version History Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === 'versions' ? 'editor' : 'versions')}
            className={`p-2 rounded-xl text-xs font-semibold items-center gap-1.5 border transition-all cursor-pointer ${
              activeTab === 'versions'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            } hidden md:flex`}
            title="Version History"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Versions</span>
          </button>

          {/* Comments Panel Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === 'comments' ? 'editor' : 'comments')}
            className={`p-2 rounded-xl text-xs font-semibold items-center gap-1.5 border transition-all relative cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            } hidden md:flex`}
            title="Comments Thread"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">Comments</span>
            {comments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                {comments.length}
              </span>
            )}
          </button>

          {/* Share Modal Trigger */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all hidden md:flex cursor-pointer"
            title="Share Document"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Mobile More Tools Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMobileFileMenu(!showMobileFileMenu)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="More Document Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Mobile Actions Dropdown Sheet */}
            {showMobileFileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{doc.title || 'Document'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{liveWordCount} words • ~{readingTimeMin} min read</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      setIsShareModalOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium md:hidden cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    Share Document
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      setShowFindReplace(!showFindReplace);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    Find & Replace
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      setActiveTab(activeTab === 'comments' ? 'editor' : 'comments');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium md:hidden cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    Comments ({comments.length})
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      setActiveTab(activeTab === 'versions' ? 'editor' : 'versions');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium md:hidden cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-600" />
                    Version History ({versions.length})
                  </button>
                  <div className="border-b border-slate-100 my-1 md:hidden" />

                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      onCreateVersion(`Snapshot - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    Save Snapshot
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      copyToClipboard();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Copy Plain Text
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      exportAsMarkdown();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export Markdown (.md)
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      exportAsPlainText();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export Plain Text (.txt)
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      exportAsHTML();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export HTML (.html)
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      window.print();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    Print / Save PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      toggleSourceMode();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                    {showSourceCode ? 'Visual Editor Mode' : 'Raw HTML Code Mode'}
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileFileMenu(false);
                      setShowOutline(!showOutline);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    {showOutline ? 'Hide Outline' : 'Show Outline'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Collapsible Find & Replace Bar */}
      {showFindReplace && (
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-6 py-2.5 flex flex-wrap items-center gap-2 text-xs z-15 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFind()}
              placeholder="Find in document..."
              className="bg-transparent text-slate-800 placeholder-slate-400 outline-hidden w-32 sm:w-48"
            />
            {matchCount > 0 && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                {matchCount} found
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Replace className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with..."
              className="bg-transparent text-slate-800 placeholder-slate-400 outline-hidden w-32 sm:w-48"
            />
          </div>

          <button
            onClick={handleFind}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-medium text-slate-700 cursor-pointer"
          >
            Find
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer"
          >
            Replace All
          </button>

          <button
            onClick={() => setShowFindReplace(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formatting Toolbar with smooth touch scrolling */}
      <div className="bg-white border-b border-slate-200/80 px-2.5 sm:px-4 py-1.5 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none z-10 text-slate-700">
        {/* Undo / Redo */}
        <button onClick={() => execCmd('undo')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Undo">
          <Undo className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('redo')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Redo">
          <Redo className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

        {/* Heading Selector */}
        <select
          value={activeHeading}
          onChange={(e) => applyFormatBlock(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 outline-hidden cursor-pointer shrink-0"
        >
          <option value="p">Normal Text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        {/* Font Family (Desktop & Tablet) */}
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            execCmd('fontName', e.target.value);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 outline-hidden cursor-pointer hidden md:block shrink-0"
        >
          <option value="Inter, sans-serif">Inter</option>
          <option value="'Playfair Display', serif">Playfair</option>
          <option value="'JetBrains Mono', monospace">Mono</option>
          <option value="Arial, sans-serif">Arial</option>
        </select>

        <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

        {/* Text Style toggles */}
        <button onClick={() => execCmd('bold')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold shrink-0" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('italic')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 italic shrink-0" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('underline')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 underline shrink-0" title="Underline">
          <Underline className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('strikeThrough')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 line-through shrink-0" title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </button>

        {/* Text Color / Highlight */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-1 shrink-0">
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              execCmd('foreColor', e.target.value);
            }}
            className="w-6 h-6 rounded-md cursor-pointer border border-slate-300 p-0"
            title="Text Color"
          />
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => {
              setHighlightColor(e.target.value);
              execCmd('hiliteColor', e.target.value);
            }}
            className="w-6 h-6 rounded-md cursor-pointer border border-slate-300 p-0"
            title="Highlight Color"
          />
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

        {/* Alignment */}
        <button onClick={() => execCmd('justifyLeft')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('justifyCenter')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('justifyRight')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Align Right">
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

        {/* Lists */}
        <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Bullet List">
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

        {/* Insert Elements */}
        <button onClick={insertTable} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Insert Table">
          <Table className="w-4 h-4" />
        </button>
        <button onClick={insertImage} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={insertCallout} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0" title="Insert Callout Note">
          <Info className="w-4 h-4 text-blue-600" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

        {/* Toggle HTML Source Code Mode */}
        <button
          onClick={toggleSourceMode}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold shrink-0 ${
            showSourceCode ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle Raw HTML Source View"
        >
          <FileCode className="w-4 h-4" />
          <span className="hidden sm:inline">{showSourceCode ? 'Visual' : 'HTML'}</span>
        </button>

        {/* Add Comment on Selection */}
        {selectedText && (
          <button
            onClick={() => {
              setActiveTab('comments');
              onAddComment('Needs review or discussion.', selectedText);
            }}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-xs animate-bounce shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment on "{selectedText.slice(0, 10)}..."</span>
          </button>
        )}
      </div>

      {/* Main Document Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Outline Table of Contents Sidebar */}
        {showOutline && (
          <>
            {/* Mobile backdrop for outline */}
            <div 
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden"
              onClick={() => setShowOutline(false)}
            />
            <aside className="fixed inset-y-16 left-0 w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto z-40 md:relative md:inset-auto md:w-56 md:shrink-0 md:border-r md:border-slate-200/80 md:shadow-none shadow-2xl h-[calc(100vh-64px)] md:h-full">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Outline
                </h4>
                <button
                  onClick={() => setShowOutline(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {headings.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Add headings (H1, H2, H3) to see document outline.</p>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      onClick={() => {
                        if (window.innerWidth < 768) setShowOutline(false);
                      }}
                      className={`block truncate text-slate-600 hover:text-blue-600 transition-colors ${
                        h.level === 1 ? 'font-bold' : h.level === 2 ? 'pl-2 font-medium' : 'pl-4 text-slate-400'
                      }`}
                    >
                      {h.text}
                    </a>
                  ))}
                </div>
              )}
            </aside>
          </>
        )}

        {/* Editor Page Canvas Area */}
        <main
          ref={scrollViewportRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-6 md:p-8 bg-slate-100/90 block"
        >
          <div className="w-full max-w-[850px] mx-auto bg-white min-h-[1050px] h-auto p-4 sm:p-8 md:p-14 rounded-2xl shadow-xl border border-slate-200/90 relative mb-28 my-1 sm:my-3 flow-root document-sheet-container">
            {/* Page Header badge */}
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mb-4 sm:mb-6 pb-2 border-b border-slate-100 flex items-center justify-between no-print">
              <span>DocuFlow • {doc.category?.toUpperCase() || 'GENERAL'}</span>
              <div className="flex items-center gap-2">
                {showSourceCode && (
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">HTML Source Mode</span>
                )}
                <span>~{estimatedPages} {estimatedPages === 1 ? 'Page' : 'Pages'}</span>
                <span>•</span>
                <span>{liveWordCount || 0} Words</span>
              </div>
            </div>

            {/* Editable Content Region or Source Mode */}
            {showSourceCode ? (
              <textarea
                value={sourceHtml}
                onChange={(e) => {
                  setSourceHtml(e.target.value);
                  onUpdateDocument(doc.id, { content: e.target.value });
                }}
                className="w-full min-h-[850px] h-auto font-mono text-xs p-3 sm:p-4 bg-[#0F172A] text-slate-200 rounded-xl border border-slate-800 focus:outline-none leading-relaxed font-normal resize-y block"
                placeholder="<h1>Type HTML source here...</h1>"
              />
            ) : (
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onMouseUp={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                className="prose prose-slate max-w-none focus:outline-hidden min-h-[850px] h-auto leading-relaxed text-slate-800 break-words flow-root"
                style={{
                  fontFamily: fontFamily,
                  fontSize: fontSize,
                }}
              />
            )}
          </div>
        </main>

        {/* Side Panels (Slide-over drawer on mobile, sidebar on desktop) */}
        {activeTab === 'comments' && (
          <div className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-80 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs sm:hidden"
              onClick={() => setActiveTab('editor')}
            />
            <div className="relative w-full sm:w-80 bg-white h-full z-10 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
              <CommentsPanel
                comments={comments}
                selectedText={selectedText}
                onAddComment={(txt, sel) => onAddComment(txt, sel)}
                onResolveComment={onResolveComment}
                onClose={() => setActiveTab('editor')}
              />
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-80 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs sm:hidden"
              onClick={() => setActiveTab('editor')}
            />
            <div className="relative w-full sm:w-80 bg-white h-full z-10 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
              <VersionHistoryPanel
                versions={versions}
                onCreateVersion={onCreateVersion}
                onRestoreVersion={handleRestoreVersionWrapper}
                onClose={() => setActiveTab('editor')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        doc={doc}
        onClose={() => setIsShareModalOpen(false)}
        onUpdateAccess={(acc) => onUpdateDocument(doc.id, { access_level: acc })}
      />

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setShowUnsavedModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-10 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Unsaved Changes</h3>
            <p className="text-xs text-slate-500 mb-5">
              You have modifications in <span className="font-semibold text-slate-700">"{title || 'Untitled'}"</span> that haven't been saved yet.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  setShowUnsavedModal(false);
                  await handleManualSave();
                  onGoBack();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save & Leave
              </button>
              <button
                onClick={() => {
                  setShowUnsavedModal(false);
                  onGoBack();
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Leave Without Saving
              </button>
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Stay in Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import mammoth from 'mammoth';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

// Escapes raw HTML entities safely
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Dynamic Loader for PDFJS from CDN
async function loadPdfJS(): Promise<any> {
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = window.pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve(pdfjsLib);
      } else {
        reject(new Error('Failed to initialize PDF.js'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF library script. Please check your internet connection.'));
    document.head.appendChild(script);
  });
}

// Parses PDF and preserves textual structures
async function parsePdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjs = await loadPdfJS();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  if (pdf.numPages === 0) {
    throw new Error('This PDF has no pages.');
  }

  let fullHtml = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (items.length === 0) {
      continue;
    }

    // Sort items vertically (descending in PDF space) and then horizontally (ascending)
    const lines: { [key: number]: any[] } = {};
    items.forEach((item) => {
      if (!item.str || !item.transform) return;
      const y = Math.round(item.transform[5]);
      if (!lines[y]) {
        lines[y] = [];
      }
      lines[y].push(item);
    });

    const sortedY = Object.keys(lines)
      .map(Number)
      .sort((a, b) => b - a);

    let pageContentHtml = '';
    sortedY.forEach((y) => {
      const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
      const lineText = lineItems.map((item) => item.str).join(' ').trim();
      if (lineText) {
        // Simple heuristic for headers based on upper case or item styles
        if (lineText.length < 60 && lineText === lineText.toUpperCase() && !lineText.match(/^[0-9.\s]+$/)) {
          pageContentHtml += `<h2>${escapeHtml(lineText)}</h2>`;
        } else {
          pageContentHtml += `<p>${escapeHtml(lineText)}</p>`;
        }
      }
    });

    if (pageContentHtml) {
      fullHtml += `<div class="pdf-imported-page mb-6">` + pageContentHtml + `</div>`;
    }
  }

  if (!fullHtml.trim()) {
    throw new Error('No readable text content could be extracted from this PDF. It may contain only scanned images.');
  }

  return fullHtml;
}

// Parses RTF files by stripping formatting commands and extracting text
function parseRtf(rtfText: string): string {
  let text = rtfText;

  // Strip headers and stylesheet blocks
  text = text.replace(/\{\\fonttbl[^}]*\}/g, '');
  text = text.replace(/\{\\colortbl[^}]*\}/g, '');
  text = text.replace(/\{\\stylesheet[^}]*\}/g, '');
  text = text.replace(/\{\\info[^}]*\}/g, '');

  // Convert par or line formatting tags to newline breaks
  text = text.replace(/\\par\b/g, '\n');
  text = text.replace(/\\line\b/g, '\n');

  // Strip other RTF codes
  text = text.replace(/\\\w+\b/g, '');
  text = text.replace(/\\'[0-9a-fA-F]{2}/g, (match) => {
    const hex = match.substring(2);
    const code = parseInt(hex, 16);
    return isNaN(code) ? '' : String.fromCharCode(code);
  });

  // Remove group braces
  text = text.replace(/[{}]/g, '');

  // Extract paragraphs
  const paragraphs = text
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    throw new Error('No text content found in RTF document.');
  }

  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
}

// Parses Markdown files and maps headers, lists, links, bold, and italic styling
function parseMarkdown(mdText: string): string {
  const lines = mdText.split(/\r?\n/);
  let html = '';
  let inList = false;
  let inOrderedList = false;

  const closeLists = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
    if (inOrderedList) {
      html += '</ol>';
      inOrderedList = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      closeLists();
      html += `<h1>${parseInlineMarkdown(trimmed.substring(2))}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      closeLists();
      html += `<h2>${parseInlineMarkdown(trimmed.substring(3))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      closeLists();
      html += `<h3>${parseInlineMarkdown(trimmed.substring(4))}</h3>`;
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('+ ')) {
      if (inOrderedList) closeLists();
      if (!inList) {
        html += '<ul class="list-disc pl-5 my-2">';
        inList = true;
      }
      html += `<li>${parseInlineMarkdown(trimmed.substring(2))}</li>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (inList) closeLists();
      if (!inOrderedList) {
        html += '<ol class="list-decimal pl-5 my-2">';
        inOrderedList = true;
      }
      const match = trimmed.match(/^\d+\.\s(.*)/);
      const content = match ? match[1] : trimmed;
      html += `<li>${parseInlineMarkdown(content)}</li>`;
    } else if (!trimmed) {
      closeLists();
    } else {
      closeLists();
      html += `<p>${parseInlineMarkdown(trimmed)}</p>`;
    }
  });

  closeLists();
  return html;
}

function parseInlineMarkdown(text: string): string {
  let result = escapeHtml(text);

  // Bold (**text** or __text__)
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.*?)_/g, '<em>$1</em>');

  // Inline Code (`code`)
  result = result.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono font-bold">$1</code>');

  // Links ([text](url))
  result = result.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

  return result;
}

// Parses raw TXT files and converts newlines into semantic HTML paragraphs
function parseTxt(txtText: string): string {
  const paragraphs = txtText
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    throw new Error('This file contains no readable text.');
  }

  return paragraphs
    .map((p) => {
      // replace internal single newlines with break tags
      const formatted = escapeHtml(p).replace(/\r?\n/g, '<br />');
      return `<p>${formatted}</p>`;
    })
    .join('');
}

export interface ImportedDocResult {
  title: string;
  content: string;
  icon: string;
}

// Single Authoritative Entrypoint for File Processing
export async function importDocumentFile(file: File): Promise<ImportedDocResult> {
  const filename = file.name;
  const sizeLimit = 15 * 1024 * 1024; // 15MB reasonable limit
  
  if (file.size > sizeLimit) {
    throw new Error('File size exceeds the limit (max 15MB allowed).');
  }

  if (file.size === 0) {
    throw new Error('The selected file is empty.');
  }

  const extension = filename.split('.').pop()?.toLowerCase();
  
  // Basic initial icon mapping based on file type
  let icon = '📄';
  if (extension === 'pdf') icon = '📕';
  else if (extension === 'doc' || extension === 'docx') icon = '📘';
  else if (extension === 'md') icon = '📝';
  else if (extension === 'rtf') icon = '📜';

  // Extract pure title (without extension)
  const title = filename.substring(0, filename.lastIndexOf('.')) || filename;

  try {
    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (!result.value.trim()) {
        throw new Error('Mammoth returned empty content. The document may contain only un-renderable objects or shapes.');
      }
      return { title, content: result.value, icon };
    } 
    
    if (extension === 'doc') {
      throw new Error('Direct binary .doc files are not supported. Please save as modern Word Document (.docx) format and try again.');
    }

    if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const content = await parsePdf(arrayBuffer);
      return { title, content, icon };
    }

    if (extension === 'md') {
      const text = await file.text();
      const content = parseMarkdown(text);
      return { title, content, icon };
    }

    if (extension === 'rtf') {
      const text = await file.text();
      const content = parseRtf(text);
      return { title, content, icon };
    }

    if (extension === 'txt') {
      const text = await file.text();
      const content = parseTxt(text);
      return { title, content, icon };
    }

    throw new Error(`Unsupported file format (.${extension}). We support PDF, DOCX, TXT, RTF, and MD.`);
  } catch (err: any) {
    console.error('File parsing failure:', err);
    throw new Error(err.message || 'An error occurred during file import and parsing.');
  }
}

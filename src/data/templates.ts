import { DocumentTemplate } from '../types';

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'template-blank',
    title: 'Blank Document',
    description: 'Start fresh with a clean slate.',
    icon: '📄',
    category: 'general',
    content: '<p>Start typing your document content here...</p>'
  },
  {
    id: 'template-meeting-notes',
    title: 'Meeting Notes & Action Items',
    description: 'Structure team check-ins, agendas, decisions, and action items.',
    icon: '📝',
    category: 'work',
    content: `
      <h1>Meeting Notes — Weekly Sync</h1>
      <p><strong>Date:</strong> August 13, 2026 | <strong>Attendees:</strong> Engineering & Design Team</p>
      <hr />
      <h2>1. Meeting Agenda</h2>
      <ul>
        <li>Q3 Product Roadmap Review & Milestones</li>
        <li>Supabase Integration & Real-time Persistence Sync</li>
        <li>User Interface Polish & Mobile Responsiveness</li>
      </ul>
      <h2>2. Key Decisions Made</h2>
      <blockquote>DocuFlow will adopt Supabase for instant document persistence, Google OAuth, and real-time collaboration.</blockquote>
      <h2>3. Action Items</h2>
      <ul>
        <li>[ ] Complete Supabase auth and profile connection</li>
        <li>[ ] Deploy document comments and inline discussion threads</li>
        <li>[ ] Benchmark real-time auto-save debouncing</li>
      </ul>
    `
  },
  {
    id: 'template-project-proposal',
    title: 'Project Proposal',
    description: 'A formal proposal structure with problem statement, timeline, and budget.',
    icon: '🚀',
    category: 'project',
    content: `
      <h1>DocuFlow Enterprise Project Proposal</h1>
      <p><em>Prepared by Product Lead | Confidential</em></p>
      <hr />
      <h2>Executive Summary</h2>
      <p>DocuFlow provides modern teams with a seamless, cloud-native document editing environment. Built with real-time collaboration and Supabase storage, DocuFlow increases team writing productivity by 40%.</p>
      <h2>Problem Statement</h2>
      <p>Current document platforms suffer from heavy load times, complex permission models, and un intuitive formatting tools.</p>
      <h2>Proposed Solution & Key Features</h2>
      <ol>
        <li><strong>Instant Cloud Sync:</strong> Debounced auto-save directly to Supabase.</li>
        <li><strong>Google OAuth:</strong> Effortless 1-click single sign-on.</li>
        <li><strong>Inline Comments & History:</strong> Audit trailing and version restoration.</li>
      </ol>
      <h2>Estimated Timeline</h2>
      <p>Phase 1 (Setup) &rarr; Phase 2 (Real-time Engine) &rarr; Phase 3 (Enterprise Audit).</p>
    `
  },
  {
    id: 'template-software-spec',
    title: 'Software Design Specification',
    description: 'Architecture diagrams, API specs, database schemas, and performance targets.',
    icon: '⚡',
    category: 'ideas',
    content: `
      <h1>Software Architecture Specification</h1>
      <p><strong>System:</strong> DocuFlow Cloud Document Engine v2.0</p>
      <hr />
      <h2>1. Overview</h2>
      <p>DocuFlow operates as a high-performance single page application (SPA) with a custom contenteditable rich-text engine, debounced state persistence, and WebSocket real-time presence.</p>
      <h2>2. Data Models</h2>
      <pre><code>// Document Schema
interface Document {
  id: string;
  title: string;
  content: string; // HTML string
  owner_id: string;
  access_level: 'private' | 'shared' | 'public_read' | 'public_edit';
  updated_at: string;
}</code></pre>
      <h2>3. Security & RLS Policies</h2>
      <p>All database queries strictly enforce Row Level Security in Supabase to ensure users can only access authorized document records.</p>
    `
  },
  {
    id: 'template-personal-journal',
    title: 'Weekly Reflection & Journal',
    description: 'Track personal goals, wins, challenges, and thoughts.',
    icon: '🌟',
    category: 'personal',
    content: `
      <h1>Weekly Focus & Reflections</h1>
      <p><em>Week of August 13, 2026</em></p>
      <hr />
      <h2>Highlights & Wins of the Week</h2>
      <ul>
        <li>Successfully integrated DocuFlow with Supabase database & auth.</li>
        <li>Mastered rich text formatting tools and real-time state sync.</li>
      </ul>
      <h2>Lessons Learned</h2>
      <p>Focusing on user intent and snappy UI feedback yields the best writing experience.</p>
      <h2>Goals for Next Week</h2>
      <p>Build 3 new custom document templates and expand export capabilities.</p>
    `
  }
];

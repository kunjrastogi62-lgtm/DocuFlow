export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  updated_at?: string;
}

export interface DocumentPermission {
  id?: string;
  document_id: string;
  user_email: string;
  permission: 'view' | 'edit' | 'comment';
  created_at?: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  highlighted_text?: string;
  text: string;
  resolved: boolean;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_name: string;
  content: string;
  created_by?: string;
  created_at: string;
}

export interface DocuFlowDocument {
  id: string;
  title: string;
  content: string;
  user_id: string;
  user_email?: string;
  is_starred: boolean;
  is_archived: boolean;
  cover_image?: string;
  icon?: string;
  category?: 'work' | 'personal' | 'ideas' | 'project' | 'general';
  access_level: 'private' | 'shared' | 'public_read' | 'public_edit';
  word_count: number;
  char_count: number;
  created_at: string;
  updated_at: string;
}

export type ViewTab = 'all' | 'recent' | 'starred' | 'trash';

export interface ActiveUserPresence {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  online_at: string;
  cursor_color?: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  content: string;
}

export interface UserSettings {
  defaultCategory: 'work' | 'personal' | 'ideas' | 'project' | 'general';
  defaultFont?: string;
  defaultFontSize?: string;
  showWordCount: boolean;
  showReadingTime?: boolean;
  enableShortcuts?: boolean;
  autoSaveInterval?: number;
  defaultFontFamily?: string;
  spellCheck?: boolean;
  focusMode?: boolean;
  soundEffects?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

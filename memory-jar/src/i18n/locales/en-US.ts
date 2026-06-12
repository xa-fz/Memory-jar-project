import type zhCN from './zh-CN'

const messages = {
  'app.tagline': 'Store everything, recall anytime',

  'auth.loginPrompt': 'Sign in',
  'auth.logout': 'Sign out',
  'auth.logoutSuccess': 'Signed out successfully',
  'auth.sessionExpired': 'Session expired. Please sign in again.',

  'login.username': 'Username',
  'login.usernamePlaceholder': 'Enter your username',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'Enter your password',
  'login.submit': 'Sign in',
  'login.success': 'Signed in successfully',
  'login.hint': 'Sign in to store and recall your memories',
  'login.error': 'Invalid username or password',
  'login.errorNetwork': 'Cannot reach the server. Is the backend running?',

  'nav.chat': 'Chat',
  'nav.documents': 'Documents',
  'nav.history': 'History',
  'nav.recentChats': 'Recent chats',

  'chat.title': 'Chat',
  'chat.subtitle': 'Search your documents first, with everyday Q&A supported',
  'chat.placeholder': 'Ask about todos, notes, or any everyday question…',
  'chat.send': 'Send',
  'chat.loading': 'Searching and generating a reply…',
  'chat.mockReply':
    'This is a mock reply. After connecting the backend, answers will be generated from your documents.',

  'documents.title': 'My documents',
  'documents.subtitle': 'Manage your uploaded document memories',
  'documents.upload': 'Upload document',
  'documents.deleteAria': 'Delete document',
  'documents.empty': 'No documents yet. Click "Upload document" to add your first memory',
  'documents.loadError': 'Failed to load documents',
  'documents.uploadSuccess': 'Document uploaded',
  'documents.uploadError': 'Failed to upload document',
  'documents.deleteSuccess': 'Document deleted',
  'documents.deleteError': 'Failed to delete document',
  'documents.acceptHint': '.txt, .md, .pdf, .doc, .docx, .json, .xml, .csv, .xlsx',

  'history.title': 'History',
  'history.subtitle': 'Browse past conversations',

  'upload.title': 'Upload file',
  'upload.dropzoneHint': 'Click to choose a file, or drag and drop here',
  'upload.confirm': 'Upload',
  'upload.cancel': 'Cancel',
  'upload.selected': 'Selected: ',
  'upload.acceptFormats': 'Supports {formats}',

  'locale.zh': '中文',
  'locale.en': 'English',
} satisfies Record<keyof typeof zhCN, string>

export default messages

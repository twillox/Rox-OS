export type IntegrationCategory = 
  | 'Communication' 
  | 'Social Media' 
  | 'Email' 
  | 'Productivity' 
  | 'CRM' 
  | 'Payments' 
  | 'Development' 
  | 'Marketing' 
  | 'AI Providers' 
  | 'Storage';

export type ConnectionStatus = 'Connected' | 'Disconnected' | 'Coming Soon' | 'Error' | 'Syncing';

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: ConnectionStatus;
  version: string;
  lastActivity?: string;
  logoUrl?: string;
  scopes: string[];
}

export const MOCK_INTEGRATIONS: Integration[] = [
  // Email
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Read, send, and let AI prioritize your inbox.',
    category: 'Email',
    status: 'Disconnected',
    version: 'v1.5.0',
    scopes: ['https://mail.google.com/'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Gmail2020.logo.png'
  },

  // Productivity
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync schedules and let AI detect conflicts.',
    category: 'Productivity',
    status: 'Disconnected',
    version: 'v1.8.0',
    scopes: ['calendar.events', 'calendar.readonly'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Import documents directly into the Company Brain.',
    category: 'Productivity',
    status: 'Disconnected',
    version: 'v2.0.0',
    scopes: ['drive.readonly'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync workspace pages, notes, and documentation.',
    category: 'Productivity',
    status: 'Disconnected',
    version: 'v1.2.0',
    scopes: ['read_content', 'update_content', 'insert_content'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg'
  },

  // Social Media
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Automate post publishing, thought leadership, and networking.',
    category: 'Social Media',
    status: 'Disconnected',
    version: 'v2.1.0',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png'
  }
];

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
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect channels and receive timeline notifications.',
    category: 'Communication',
    status: 'Disconnected',
    version: 'v2.4.1',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Route customer messages directly into Roxten OS.',
    category: 'Communication',
    status: 'Disconnected',
    version: 'v1.0.0',
    scopes: ['messages:read', 'messages:write'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Sync meetings and internal chats.',
    category: 'Communication',
    status: 'Coming Soon',
    version: 'v1.0.0-beta',
    scopes: [],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg'
  },

  // Social Media
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Manage DMs, comments, and schedule posts.',
    category: 'Social Media',
    status: 'Disconnected',
    version: 'v3.2.0',
    scopes: ['instagram_basic', 'pages_show_list', 'instagram_manage_messages'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Automate lead generation and messaging.',
    category: 'Social Media',
    status: 'Disconnected',
    version: 'v2.1.0',
    scopes: ['r_liteprofile', 'w_member_social'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png'
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    description: 'Monitor brand mentions and schedule tweets.',
    category: 'Social Media',
    status: 'Coming Soon',
    version: 'v2.0.0',
    scopes: [],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg'
  },

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
    description: 'Sync workspace pages and meeting notes.',
    category: 'Productivity',
    status: 'Disconnected',
    version: 'v1.2.0',
    scopes: ['read_content', 'update_content'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg'
  },

  // CRM
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and marketing campaigns.',
    category: 'CRM',
    status: 'Disconnected',
    version: 'v4.1.0',
    scopes: ['crm.objects.contacts.read'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/22/HubSpot_Logo.png'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise pipeline management and sync.',
    category: 'CRM',
    status: 'Coming Soon',
    version: 'v1.0.0',
    scopes: [],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg'
  },

  // Payments
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Track revenue, invoices, and customer payments.',
    category: 'Payments',
    status: 'Disconnected',
    version: 'v2023-10-16',
    scopes: ['read_write'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg'
  },

  // Development
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync repositories, issues, and let AI review PRs.',
    category: 'Development',
    status: 'Disconnected',
    version: 'v1.1.0',
    scopes: ['repo', 'read:user'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg'
  },
  
  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Sync newsletter audiences and campaign metrics.',
    category: 'Marketing',
    status: 'Disconnected',
    version: 'v3.0',
    scopes: ['lists:read', 'campaigns:read'],
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Mailchimp_Logo_2020.svg'
  }
];

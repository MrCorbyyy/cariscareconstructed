/**
 * Permission catalogue and default role grants.
 *
 * Permission keys follow `<module>.<action>`. The backend checks these keys on every
 * protected route; the admin UI only uses them to hide controls the user cannot use.
 */

/** Publishable content modules (support draft → review → published → archived). */
export const CONTENT_MODULES = [
  'slides',
  'pages',
  'articles',
  'research',
  'publications',
  'lmi',
  'staff',
  'partners',
  'cpd',
  'events',
  'newsletters',
  'galleries',
] as const;

const CONTENT_ACTIONS = ['read', 'create', 'update', 'update_own', 'delete', 'publish'] as const;

type ModuleDef = { module: string; label: string; actions: readonly string[] };

const MODULE_LABELS: Record<string, string> = {
  slides: 'Homepage slides',
  pages: 'Pages',
  articles: 'News & announcements',
  research: 'Research themes & projects',
  publications: 'Publications',
  lmi: 'LMI reports',
  staff: 'Staff profiles',
  partners: 'Partners',
  cpd: 'CPD programmes & sessions',
  events: 'Events',
  newsletters: 'Newsletters',
  galleries: 'Galleries',
};

const MODULES: ModuleDef[] = [
  ...CONTENT_MODULES.map((m) => ({ module: m, label: MODULE_LABELS[m], actions: CONTENT_ACTIONS })),
  { module: 'categories', label: 'News categories', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'media', label: 'Media library', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'menus', label: 'Navigation menus', actions: ['read', 'update'] },
  { module: 'registrations', label: 'CPD registrations', actions: ['read', 'update', 'delete'] },
  { module: 'submissions', label: 'Contact submissions', actions: ['read', 'update', 'delete'] },
  { module: 'subscribers', label: 'Newsletter subscribers', actions: ['read', 'update', 'delete'] },
  { module: 'settings', label: 'Site settings', actions: ['read', 'update'] },
  { module: 'redirects', label: 'URL redirects', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'users', label: 'Users & roles', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'audit', label: 'Audit log', actions: ['read'] },
];

const ACTION_LABELS: Record<string, string> = {
  read: 'View',
  create: 'Create',
  update: 'Edit any',
  update_own: 'Edit own',
  delete: 'Delete',
  publish: 'Publish',
};

export const PERMISSIONS = MODULES.flatMap(({ module, label, actions }) =>
  actions.map((action) => ({
    key: `${module}.${action}`,
    label: `${ACTION_LABELS[action] ?? action} – ${label}`,
    group: label,
  })),
);

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

const keys = (modules: readonly string[], actions: readonly string[]) =>
  modules.flatMap((m) => actions.map((a) => `${m}.${a}`)).filter((k) => ALL_PERMISSION_KEYS.includes(k));

export const ROLE_DEFINITIONS: Array<{
  name: string;
  label: string;
  description: string;
  permissions: string[];
}> = [
  {
    name: 'super_admin',
    label: 'Super Administrator',
    description: 'Full access, including user management and system settings.',
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    name: 'admin',
    label: 'Administrator',
    description: 'Manages all website content, submissions, menus and operational settings.',
    permissions: ALL_PERMISSION_KEYS.filter((k) => !k.startsWith('users.') || k === 'users.read'),
  },
  {
    name: 'editor',
    label: 'Editor',
    description: 'Creates, reviews and publishes content; manages media.',
    permissions: [
      ...keys(CONTENT_MODULES, CONTENT_ACTIONS),
      ...keys(['categories', 'media'], ['read', 'create', 'update', 'delete']),
      'menus.read',
    ],
  },
  {
    name: 'author',
    label: 'Author',
    description: 'Creates content and edits their own drafts; submits them for review.',
    permissions: [
      ...keys(['articles', 'events', 'publications', 'research', 'newsletters', 'galleries', 'cpd'], [
        'read',
        'create',
        'update_own',
      ]),
      'categories.read',
      'media.read',
      'media.create',
    ],
  },
  {
    name: 'reviewer',
    label: 'Reviewer',
    description: 'Read-only access to content in the dashboard.',
    permissions: [...keys(CONTENT_MODULES, ['read']), 'categories.read', 'media.read', 'menus.read'],
  },
];

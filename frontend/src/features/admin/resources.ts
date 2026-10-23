/**
 * Declarative configuration for the generic admin list/edit screens. Each entry mirrors a backend
 * resource (backend/src/routes/admin/resources.ts) and its Zod schema (backend/src/validators/content.ts).
 */
import type { ImageSlot } from '@/components/ui/CmsImage';
import { ARTICLE_TYPE_LABELS, EVENT_TYPE_LABELS, PUBLICATION_TYPE_LABELS } from '@/lib/format';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'relation'
  | 'multirelation'
  | 'media'
  | 'url'
  | 'email'
  | 'slug'
  | 'indicators'
  | 'mediaList'
  | 'galleryItems';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  /** For relation fields: admin endpoint to load options from and the label field. */
  source?: { path: string; labelField: string };
  /** For media fields: which kind to pick and which image slot it fills (for size guidance). */
  media?: { kind: 'image' | 'document'; slot?: ImageSlot };
  /** Which tab/section of the form the field appears in. */
  section?: 'main' | 'details' | 'media' | 'seo' | 'publishing';
  max?: number;
}

export interface ColumnDef {
  key: string;
  label: string;
  format?: 'date' | 'datetime' | 'status' | 'image' | 'label' | 'boolean';
  labels?: Record<string, string>;
}

export interface ResourceDef {
  key: string;
  label: string;
  singular: string;
  /** Admin API path below /admin. */
  api: string;
  permission: string;
  titleField: string;
  publishable: boolean;
  columns: ColumnDef[];
  fields: FieldDef[];
  filters?: Array<{ param: string; label: string; options: Array<{ value: string; label: string }> }>;
  defaultQuery?: Record<string, string>;
  /** Public URL of a record, for "View on site". */
  publicUrl?: (row: Record<string, unknown>) => string | null;
  sortable?: boolean;
  description?: string;
}

const opts = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

const SEO: FieldDef[] = [
  { name: 'seo_title', label: 'SEO title', type: 'text', section: 'seo', hint: 'Defaults to the title. Aim for under 60 characters.', max: 255 },
  { name: 'seo_description', label: 'Meta description', type: 'textarea', section: 'seo', hint: 'Shown in search results. Aim for 120–160 characters.', max: 500 },
  { name: 'og_image_id', label: 'Social sharing image', type: 'media', section: 'seo', media: { kind: 'image' }, hint: '1200 × 630 px recommended.' },
];

const PUBLISHING: FieldDef[] = [
  { name: 'published_at', label: 'Publish date', type: 'datetime', section: 'publishing', hint: 'A future date schedules publication.' },
  { name: 'review_note', label: 'Internal review note', type: 'textarea', section: 'publishing', hint: 'Never shown publicly. Clear it once the item has been checked.' },
];

const statusCol: ColumnDef = { key: 'status', label: 'Status', format: 'status' };
const updatedCol: ColumnDef = { key: 'updated_at', label: 'Updated', format: 'date' };

export const RESOURCES: ResourceDef[] = [
  {
    key: 'articles',
    label: 'News & announcements',
    singular: 'article',
    api: '/articles',
    permission: 'articles',
    titleField: 'title',
    publishable: true,
    description: 'News stories, press releases, announcements, calls and profile stories.',
    columns: [
      { key: 'featuredImage', label: '', format: 'image' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type', format: 'label', labels: ARTICLE_TYPE_LABELS },
      statusCol,
      { key: 'published_at', label: 'Published', format: 'date' },
    ],
    filters: [{ param: 'type', label: 'Type', options: opts(ARTICLE_TYPE_LABELS) }],
    publicUrl: (r) => `/news/${r.slug}`,
    fields: [
      { name: 'title', label: 'Headline', type: 'text', required: true, max: 300 },
      { name: 'type', label: 'Type', type: 'select', options: opts(ARTICLE_TYPE_LABELS), required: true },
      { name: 'excerpt', label: 'Summary', type: 'textarea', hint: 'Shown on cards and in search results (1–3 sentences).', max: 2000 },
      { name: 'body', label: 'Body', type: 'richtext' },
      { name: 'featured_image_id', label: 'Featured image', type: 'media', section: 'media', media: { kind: 'image', slot: 'articleFeature' } },
      { name: 'attachment_id', label: 'Attached document', type: 'media', section: 'media', media: { kind: 'document' }, hint: 'e.g. an application form or call document.' },
      { name: 'category_ids', label: 'Topics', type: 'multirelation', section: 'details', source: { path: '/categories?pageSize=100', labelField: 'name' } },
      { name: 'author_name', label: 'Author / byline', type: 'text', section: 'details', max: 150 },
      { name: 'deadline_at', label: 'Deadline (calls & announcements)', type: 'datetime', section: 'details' },
      { name: 'is_featured', label: 'Feature on the homepage', type: 'boolean', section: 'details' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details', hint: 'Generated from the headline if left blank.' },
      ...PUBLISHING,
      ...SEO,
    ],
  },
  {
    key: 'pages',
    label: 'Pages',
    singular: 'page',
    api: '/pages',
    permission: 'pages',
    titleField: 'title',
    publishable: true,
    description: 'About, Research, Stakeholder Engagement and other content pages.',
    columns: [{ key: 'title', label: 'Title' }, { key: 'path', label: 'Path' }, statusCol, updatedCol],
    publicUrl: (r) => `/${r.path}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 255 },
      { name: 'path', label: 'Path', type: 'text', required: true, hint: 'Address after the domain, e.g. about/history. Lower-case letters, numbers, hyphens and /.' },
      { name: 'summary', label: 'Introduction', type: 'textarea', hint: 'Shown under the page title and in search results.', max: 2000 },
      { name: 'body', label: 'Content', type: 'richtext' },
      { name: 'hero_image_id', label: 'Banner image', type: 'media', section: 'media', media: { kind: 'image', slot: 'pageBanner' } },
      { name: 'parent_id', label: 'Parent page', type: 'relation', section: 'details', source: { path: '/pages?pageSize=100&sort=path&dir=asc', labelField: 'path' } },
      { name: 'template', label: 'Layout', type: 'select', section: 'details', options: [{ value: 'standard', label: 'Standard (with section sidebar)' }, { value: 'wide', label: 'Wide (no sidebar)' }, { value: 'landing', label: 'Landing' }] },
      { name: 'sort_order', label: 'Order among siblings', type: 'number', section: 'details' },
      { name: 'show_in_sitemap', label: 'Include in sitemap', type: 'boolean', section: 'details' },
      ...PUBLISHING,
      ...SEO,
    ],
  },
  {
    key: 'slides',
    label: 'Homepage slides',
    singular: 'slide',
    api: '/slides',
    permission: 'slides',
    titleField: 'title',
    publishable: true,
    sortable: true,
    description: 'Hero carousel on the homepage. Drag order is the display order.',
    columns: [{ key: 'image', label: '', format: 'image' }, { key: 'title', label: 'Heading' }, statusCol, { key: 'starts_at', label: 'Shows from', format: 'date' }, { key: 'ends_at', label: 'Until', format: 'date' }],
    fields: [
      { name: 'title', label: 'Heading', type: 'text', required: true, max: 255 },
      { name: 'caption', label: 'Supporting text', type: 'textarea', max: 1000 },
      { name: 'image_id', label: 'Image', type: 'media', section: 'media', media: { kind: 'image', slot: 'hero' } },
      { name: 'image_alt', label: 'Image description (alt text)', type: 'text', section: 'media', hint: 'Describe the photo for people who cannot see it.' },
      { name: 'button_label', label: 'Primary button label', type: 'text', section: 'details', max: 80 },
      { name: 'button_url', label: 'Primary button link', type: 'url', section: 'details', hint: '/about or https://…' },
      { name: 'secondary_label', label: 'Secondary button label', type: 'text', section: 'details', max: 80 },
      { name: 'secondary_url', label: 'Secondary button link', type: 'url', section: 'details' },
      { name: 'starts_at', label: 'Show from', type: 'datetime', section: 'publishing' },
      { name: 'ends_at', label: 'Show until', type: 'datetime', section: 'publishing' },
      ...PUBLISHING,
    ],
  },
  {
    key: 'publications',
    label: 'Publications',
    singular: 'publication',
    api: '/publications',
    permission: 'publications',
    titleField: 'title',
    publishable: true,
    description: 'Reports, policy briefs, journal articles and other resources.',
    columns: [
      { key: 'coverImage', label: '', format: 'image' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type', format: 'label', labels: PUBLICATION_TYPE_LABELS },
      { key: 'publication_year', label: 'Year' },
      statusCol,
    ],
    filters: [{ param: 'type', label: 'Type', options: opts(PUBLICATION_TYPE_LABELS) }],
    publicUrl: (r) => `/publications/${r.slug}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 500 },
      { name: 'type', label: 'Type', type: 'select', required: true, options: opts(PUBLICATION_TYPE_LABELS) },
      { name: 'authors', label: 'Authors', type: 'text', hint: 'Separate names with semicolons.', max: 1000 },
      { name: 'abstract', label: 'Abstract / summary', type: 'textarea', max: 10000 },
      { name: 'body', label: 'Additional content', type: 'richtext' },
      { name: 'file_id', label: 'Document (PDF)', type: 'media', section: 'media', media: { kind: 'document' } },
      { name: 'cover_image_id', label: 'Cover image', type: 'media', section: 'media', media: { kind: 'image', slot: 'publicationCover' } },
      { name: 'publication_year', label: 'Year', type: 'number', section: 'details' },
      { name: 'published_on', label: 'Publication date', type: 'date', section: 'details' },
      { name: 'venue', label: 'Journal / publisher', type: 'text', section: 'details', max: 300 },
      { name: 'doi', label: 'DOI', type: 'text', section: 'details', hint: 'e.g. 10.1016/j.ijpe.2020.107762' },
      { name: 'external_url', label: 'External link', type: 'url', section: 'details', hint: 'Publisher page, if the full text is hosted elsewhere.' },
      { name: 'citation', label: 'Citation', type: 'textarea', section: 'details', max: 3000 },
      { name: 'research_project_id', label: 'Research project', type: 'relation', section: 'details', source: { path: '/research-projects?pageSize=100', labelField: 'title' } },
      { name: 'is_featured', label: 'Feature on the homepage', type: 'boolean', section: 'details' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
      ...SEO,
    ],
  },
  {
    key: 'research-projects',
    label: 'Research projects',
    singular: 'research project',
    api: '/research-projects',
    permission: 'research',
    titleField: 'title',
    publishable: true,
    columns: [{ key: 'title', label: 'Title' }, { key: 'programme', label: 'Programme' }, { key: 'project_status', label: 'Project status' }, statusCol],
    publicUrl: (r) => `/research/projects/${r.slug}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 300 },
      { name: 'summary', label: 'Summary', type: 'textarea', max: 3000 },
      { name: 'problem', label: 'Research problem', type: 'textarea', max: 5000 },
      { name: 'contribution', label: 'Contribution', type: 'textarea', max: 5000 },
      { name: 'relevance', label: 'Practical relevance', type: 'textarea', max: 5000 },
      { name: 'body', label: 'Further detail', type: 'richtext' },
      { name: 'image_id', label: 'Image', type: 'media', section: 'media', media: { kind: 'image', slot: 'feature' } },
      { name: 'theme_id', label: 'Theme', type: 'relation', section: 'details', source: { path: '/research-themes?pageSize=100', labelField: 'name' } },
      { name: 'programme', label: 'Programme', type: 'text', section: 'details', hint: 'e.g. ASN-RA' },
      { name: 'project_status', label: 'Project status', type: 'select', section: 'details', options: [{ value: 'ongoing', label: 'Ongoing' }, { value: 'completed', label: 'Completed' }, { value: 'planned', label: 'Planned' }] },
      { name: 'start_year', label: 'Start year', type: 'number', section: 'details' },
      { name: 'end_year', label: 'End year', type: 'number', section: 'details' },
      { name: 'lead_researchers', label: 'Researchers', type: 'text', section: 'details', max: 500 },
      { name: 'team', label: 'Team / partners', type: 'textarea', section: 'details' },
      { name: 'is_featured', label: 'Featured', type: 'boolean', section: 'details' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
      ...SEO,
    ],
  },
  {
    key: 'research-themes',
    label: 'Research themes',
    singular: 'research theme',
    api: '/research-themes',
    permission: 'research',
    titleField: 'name',
    publishable: true,
    sortable: true,
    columns: [{ key: 'name', label: 'Theme' }, statusCol, updatedCol],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 150 },
      { name: 'summary', label: 'Summary', type: 'textarea', max: 2000 },
      { name: 'description', label: 'Description', type: 'richtext' },
      { name: 'image_id', label: 'Image', type: 'media', section: 'media', media: { kind: 'image', slot: 'feature' } },
      { name: 'icon', label: 'Icon name', type: 'text', section: 'details', hint: 'Optional Lucide icon name.' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
    ],
  },
  {
    key: 'lmi-reports',
    label: 'LMI reports',
    singular: 'LMI report',
    api: '/lmi-reports',
    permission: 'lmi',
    titleField: 'title',
    publishable: true,
    description: 'Quarterly Ghana LMI reports. Enter index values only from the published report.',
    columns: [{ key: 'title', label: 'Report' }, { key: 'lmi_value', label: 'LMI' }, statusCol, updatedCol],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
      { name: 'quarter', label: 'Quarter', type: 'select', options: [1, 2, 3, 4].map((q) => ({ value: String(q), label: `Q${q}` })) },
      { name: 'period_label', label: 'Period label', type: 'text', required: true, hint: 'e.g. April – June 2025' },
      { name: 'summary', label: 'Key findings', type: 'textarea' },
      { name: 'body', label: 'Commentary', type: 'richtext' },
      { name: 'file_id', label: 'Report PDF', type: 'media', section: 'media', media: { kind: 'document' } },
      { name: 'cover_image_id', label: 'Cover image', type: 'media', section: 'media', media: { kind: 'image', slot: 'publicationCover' } },
      { name: 'lmi_value', label: 'LMI value', type: 'number', section: 'details', hint: 'Headline index from the report (0–100).' },
      { name: 'future_lmi_value', label: 'Future LMI (outlook)', type: 'number', section: 'details' },
      { name: 'value_source_url', label: 'Source of values', type: 'url', section: 'details', hint: 'Link to the release or report the values come from.' },
      { name: 'indicators', label: 'Component indices', type: 'indicators', section: 'details' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
    ],
  },
  {
    key: 'events',
    label: 'Events',
    singular: 'event',
    api: '/events',
    permission: 'events',
    titleField: 'title',
    publishable: true,
    columns: [
      { key: 'image', label: '', format: 'image' },
      { key: 'title', label: 'Event' },
      { key: 'event_type', label: 'Type', format: 'label', labels: EVENT_TYPE_LABELS },
      { key: 'starts_at', label: 'Starts', format: 'datetime' },
      statusCol,
    ],
    filters: [
      { param: 'when', label: 'When', options: [{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }] },
      { param: 'type', label: 'Type', options: opts(EVENT_TYPE_LABELS) },
    ],
    publicUrl: (r) => `/events/${r.slug}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 300 },
      { name: 'event_type', label: 'Type', type: 'select', options: opts(EVENT_TYPE_LABELS) },
      { name: 'starts_at', label: 'Starts', type: 'datetime', required: true },
      { name: 'ends_at', label: 'Ends', type: 'datetime' },
      { name: 'all_day', label: 'All-day event', type: 'boolean' },
      { name: 'summary', label: 'Summary', type: 'textarea', max: 3000 },
      { name: 'body', label: 'Details', type: 'richtext' },
      { name: 'image_id', label: 'Banner or poster', type: 'media', section: 'media', media: { kind: 'image', slot: 'eventBanner' } },
      { name: 'attachment_ids', label: 'Downloadable materials', type: 'mediaList', section: 'media', media: { kind: 'document' } },
      { name: 'venue', label: 'Venue', type: 'text', section: 'details', max: 255 },
      { name: 'location_type', label: 'Format', type: 'select', section: 'details', options: [{ value: 'in_person', label: 'In person' }, { value: 'online', label: 'Online' }, { value: 'hybrid', label: 'Hybrid' }] },
      { name: 'cost_text', label: 'Cost', type: 'text', section: 'details' },
      { name: 'registration_url', label: 'Registration link', type: 'url', section: 'details' },
      { name: 'website_url', label: 'Event website', type: 'url', section: 'details', hint: 'e.g. the summit website.' },
      { name: 'gallery_id', label: 'Photo gallery', type: 'relation', section: 'details', source: { path: '/galleries?pageSize=100', labelField: 'title' } },
      { name: 'is_featured', label: 'Featured', type: 'boolean', section: 'details' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
      ...SEO,
    ],
  },
  {
    key: 'cpd-programmes',
    label: 'CPD programmes',
    singular: 'CPD programme',
    api: '/cpd-programmes',
    permission: 'cpd',
    titleField: 'title',
    publishable: true,
    columns: [{ key: 'image', label: '', format: 'image' }, { key: 'title', label: 'Programme' }, statusCol, updatedCol],
    publicUrl: (r) => `/training/cpd/${r.slug}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 300 },
      { name: 'summary', label: 'Summary', type: 'textarea', max: 3000 },
      { name: 'description', label: 'Description', type: 'richtext' },
      { name: 'target_audience', label: 'Who should attend', type: 'textarea' },
      { name: 'learning_objectives', label: 'Learning objectives', type: 'textarea' },
      { name: 'facilitators', label: 'Facilitators', type: 'textarea', hint: 'Only confirmed facilitators.' },
      { name: 'image_id', label: 'Image', type: 'media', section: 'media', media: { kind: 'image', slot: 'training' } },
      { name: 'duration', label: 'Duration', type: 'text', section: 'details' },
      { name: 'delivery_format', label: 'Delivery format', type: 'text', section: 'details' },
      { name: 'fee_text', label: 'Fee', type: 'text', section: 'details' },
      { name: 'registration_url', label: 'External registration link', type: 'url', section: 'details' },
      { name: 'is_featured', label: 'Featured', type: 'boolean', section: 'details' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
      ...SEO,
    ],
  },
  {
    key: 'cpd-sessions',
    label: 'CPD sessions',
    singular: 'CPD session',
    api: '/cpd-sessions',
    permission: 'cpd',
    titleField: 'label',
    publishable: false,
    description: 'Dated sessions of a CPD programme, with capacity and registration settings.',
    columns: [{ key: 'programme.title', label: 'Programme' }, { key: 'starts_at', label: 'Starts', format: 'datetime' }, { key: 'registration_status', label: 'Registration' }, { key: 'capacity', label: 'Capacity' }],
    filters: [{ param: 'when', label: 'When', options: [{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }] }],
    fields: [
      { name: 'programme_id', label: 'Programme', type: 'relation', required: true, source: { path: '/cpd-programmes?pageSize=100', labelField: 'title' } },
      { name: 'label', label: 'Session label', type: 'text', hint: 'Optional, e.g. "Cohort 2".' },
      { name: 'starts_at', label: 'Starts', type: 'datetime', required: true },
      { name: 'ends_at', label: 'Ends', type: 'datetime' },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'delivery_mode', label: 'Format', type: 'select', options: [{ value: 'in_person', label: 'In person' }, { value: 'online', label: 'Online' }, { value: 'hybrid', label: 'Hybrid' }] },
      { name: 'fee_text', label: 'Fee', type: 'text' },
      { name: 'capacity', label: 'Capacity', type: 'number', hint: 'Leave empty for unlimited. Further sign-ups are wait-listed.' },
      { name: 'registration_status', label: 'Registration', type: 'select', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'full', label: 'Full' }, { value: 'cancelled', label: 'Cancelled' }] },
      { name: 'allow_online_registration', label: 'Accept registrations on this website', type: 'boolean' },
      { name: 'registration_url', label: 'External registration link', type: 'url', hint: 'Used when website registration is off.' },
    ],
  },
  {
    key: 'staff',
    label: 'Staff profiles',
    singular: 'staff profile',
    api: '/staff',
    permission: 'staff',
    titleField: 'name',
    publishable: true,
    sortable: true,
    columns: [{ key: 'photo', label: '', format: 'image' }, { key: 'name', label: 'Name' }, { key: 'position', label: 'Role' }, { key: 'group.name', label: 'Group' }, statusCol],
    publicUrl: (r) => `/about/team/${r.slug}`,
    fields: [
      { name: 'name', label: 'Name (with title)', type: 'text', required: true, max: 150 },
      { name: 'position', label: 'Role', type: 'text', max: 200 },
      { name: 'group_id', label: 'Group', type: 'relation', source: { path: '/staff-groups?pageSize=50', labelField: 'name' } },
      { name: 'bio', label: 'Biography', type: 'richtext', hint: 'A profile page is shown only when a biography exists.' },
      { name: 'photo_id', label: 'Portrait', type: 'media', section: 'media', media: { kind: 'image', slot: 'portrait' } },
      { name: 'department', label: 'Department / affiliation', type: 'text', section: 'details' },
      { name: 'qualifications', label: 'Qualifications', type: 'textarea', section: 'details' },
      { name: 'email', label: 'Public email', type: 'email', section: 'details' },
      { name: 'linkedin_url', label: 'LinkedIn', type: 'url', section: 'details' },
      { name: 'scholar_url', label: 'Google Scholar', type: 'url', section: 'details' },
      { name: 'orcid_url', label: 'ORCID', type: 'url', section: 'details' },
      { name: 'website_url', label: 'Website', type: 'url', section: 'details' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
    ],
  },
  {
    key: 'partners',
    label: 'Partners',
    singular: 'partner',
    api: '/partners',
    permission: 'partners',
    titleField: 'name',
    publishable: true,
    sortable: true,
    columns: [{ key: 'logo', label: '', format: 'image' }, { key: 'name', label: 'Partner' }, { key: 'partner_type', label: 'Type' }, statusCol],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'partner_type', label: 'Type', type: 'select', options: opts({ host: 'Host institution', funder: 'Funder', academic: 'Academic', industry: 'Industry', public_sector: 'Public sector', professional_body: 'Professional body', other: 'Other' }) },
      { name: 'description', label: 'Description of the relationship', type: 'textarea', hint: 'Only verified partnership information.' },
      { name: 'website_url', label: 'Website', type: 'url' },
      { name: 'logo_id', label: 'Logo', type: 'media', section: 'media', media: { kind: 'image', slot: 'partnerLogo' }, hint: 'Use only approved logos.' },
      { name: 'is_featured', label: 'Show on homepage', type: 'boolean', section: 'details' },
      ...PUBLISHING,
    ],
  },
  {
    key: 'newsletters',
    label: 'Newsletters',
    singular: 'newsletter issue',
    api: '/newsletters',
    permission: 'newsletters',
    titleField: 'title',
    publishable: true,
    columns: [{ key: 'coverImage', label: '', format: 'image' }, { key: 'title', label: 'Issue' }, { key: 'published_on', label: 'Date', format: 'date' }, statusCol],
    publicUrl: (r) => `/newsletters/${r.slug}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'issue_number', label: 'Issue number', type: 'number' },
      { name: 'published_on', label: 'Issue date', type: 'date' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      { name: 'highlights', label: 'In this issue', type: 'richtext' },
      { name: 'cover_image_id', label: 'Cover', type: 'media', section: 'media', media: { kind: 'image', slot: 'newsletterCover' } },
      { name: 'file_id', label: 'PDF', type: 'media', section: 'media', media: { kind: 'document' } },
      { name: 'online_url', label: 'View online link', type: 'url', section: 'details' },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
    ],
  },
  {
    key: 'galleries',
    label: 'Galleries',
    singular: 'gallery',
    api: '/galleries',
    permission: 'galleries',
    titleField: 'title',
    publishable: true,
    columns: [{ key: 'coverImage', label: '', format: 'image' }, { key: 'title', label: 'Gallery' }, statusCol, updatedCol],
    publicUrl: (r) => `/gallery/${r.slug}`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'cover_image_id', label: 'Cover image', type: 'media', section: 'media', media: { kind: 'image', slot: 'gallery' } },
      { name: 'items', label: 'Photos', type: 'galleryItems', section: 'media', media: { kind: 'image', slot: 'gallery' } },
      { name: 'slug', label: 'URL slug', type: 'slug', section: 'details' },
      ...PUBLISHING,
    ],
  },
  {
    key: 'categories',
    label: 'News topics',
    singular: 'topic',
    api: '/categories',
    permission: 'categories',
    titleField: 'name',
    publishable: false,
    sortable: true,
    columns: [{ key: 'name', label: 'Topic' }, { key: 'slug', label: 'Slug' }],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'slug', label: 'URL slug', type: 'slug' },
    ],
  },
  {
    key: 'staff-groups',
    label: 'Staff groups',
    singular: 'staff group',
    api: '/staff-groups',
    permission: 'staff',
    titleField: 'name',
    publishable: false,
    sortable: true,
    columns: [{ key: 'name', label: 'Group' }],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'slug', label: 'Anchor', type: 'slug' },
    ],
  },
  {
    key: 'redirects',
    label: 'URL redirects',
    singular: 'redirect',
    api: '/redirects',
    permission: 'redirects',
    titleField: 'from_path',
    publishable: false,
    description: 'Permanent redirects from legacy WordPress URLs and moved pages.',
    columns: [{ key: 'from_path', label: 'From' }, { key: 'to_path', label: 'To' }, { key: 'status_code', label: 'Code' }, { key: 'hits', label: 'Hits' }, { key: 'is_enabled', label: 'Enabled', format: 'boolean' }],
    fields: [
      { name: 'from_path', label: 'Old path', type: 'text', required: true, hint: 'e.g. /about-us/about-us' },
      { name: 'to_path', label: 'New path or URL', type: 'text', required: true },
      { name: 'status_code', label: 'Type', type: 'select', options: [{ value: '301', label: '301 Permanent' }, { value: '302', label: '302 Temporary' }] },
      { name: 'is_enabled', label: 'Enabled', type: 'boolean' },
      { name: 'note', label: 'Note', type: 'text' },
    ],
  },
];

export const getResource = (key: string) => RESOURCES.find((r) => r.key === key);

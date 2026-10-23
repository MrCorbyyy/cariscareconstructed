/** Shapes returned by the CARISCA Express API (/api/v1). */

export interface ApiList<T> {
  data: T[];
  meta: PageMeta;
}
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Media {
  id: number;
  url: string;
  kind: 'image' | 'document' | 'video' | 'other';
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  title: string | null;
  original_name: string;
}

export interface MenuNode {
  id: number;
  label: string;
  href: string;
  description: string | null;
  open_in_new_tab: boolean;
  external: boolean;
  children: MenuNode[];
}

export type SiteSettings = Record<string, string | null>;

export interface SiteData {
  settings: SiteSettings;
  menus: Record<string, MenuNode[]>;
}

export interface Seo {
  seo_title?: string | null;
  seo_description?: string | null;
  ogImage?: Media | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export type ArticleType =
  | 'news'
  | 'press_release'
  | 'announcement'
  | 'call'
  | 'research_highlight'
  | 'project_update'
  | 'story'
  | 'newsletter_announcement';

export interface ArticleSummary {
  id: number;
  type: ArticleType;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
  deadline_at: string | null;
  author_name: string | null;
  is_featured: boolean;
  featuredImage?: Media | null;
  attachment?: Media | null;
  categories?: Category[];
}

export interface Article extends ArticleSummary, Seo {
  body: string | null;
  related: ArticleSummary[];
  updated_at: string;
}

export interface Page extends Seo {
  id: number;
  title: string;
  path: string;
  template: 'standard' | 'wide' | 'landing';
  summary: string | null;
  body: string | null;
  heroImage?: Media | null;
  parent?: { id: number; title: string; path: string } | null;
  updated_at: string;
}

export type PageResolution =
  | { type: 'page'; page: Page; siblings: Array<{ id: number; title: string; path: string }> }
  | { type: 'redirect'; to: string; status: number };

export interface Slide {
  id: number;
  title: string;
  caption: string | null;
  image?: Media | null;
  image_alt: string | null;
  button_label: string | null;
  button_url: string | null;
  secondary_label: string | null;
  secondary_url: string | null;
}

export type PublicationType =
  | 'research_report'
  | 'industry_report'
  | 'policy_brief'
  | 'journal_article'
  | 'working_paper'
  | 'research_summary'
  | 'book'
  | 'conference_paper'
  | 'other';

export interface Publication extends Seo {
  id: number;
  type: PublicationType;
  title: string;
  slug: string;
  authors: string | null;
  abstract: string | null;
  body?: string | null;
  publication_year: number | null;
  published_on?: string | null;
  venue?: string | null;
  doi?: string | null;
  external_url: string | null;
  citation?: string | null;
  is_featured: boolean;
  coverImage?: Media | null;
  file?: Media | null;
  researchProject?: { id: number; title: string; slug: string } | null;
  related?: Publication[];
}

export interface ResearchTheme {
  id: number;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  icon: string | null;
  image?: Media | null;
}

export interface ResearchProject extends Seo {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  problem: string | null;
  contribution: string | null;
  relevance: string | null;
  body?: string | null;
  project_status: 'planned' | 'ongoing' | 'completed';
  programme: string | null;
  start_year: number | null;
  end_year: number | null;
  lead_researchers: string | null;
  team: string | null;
  image?: Media | null;
  theme?: { id: number; name: string; slug: string } | null;
  publications?: Array<Pick<Publication, 'id' | 'type' | 'title' | 'slug' | 'publication_year'>>;
}

export interface LmiReport {
  id: number;
  title: string;
  slug: string;
  year: number;
  quarter: number | null;
  period_label: string;
  lmi_value: string | null;
  future_lmi_value: string | null;
  value_source_url: string | null;
  summary: string | null;
  body?: string | null;
  file?: Media | null;
  coverImage?: Media | null;
  indicators: Array<{ indicator: string; label: string; value: string }>;
}

export interface StaffMember {
  id: number;
  name: string;
  slug: string;
  position: string | null;
  department: string | null;
  photo?: Media | null;
  has_profile?: boolean;
  bio?: string | null;
  qualifications?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  scholar_url?: string | null;
  orcid_url?: string | null;
  website_url?: string | null;
  group?: { id: number; name: string; slug: string } | null;
}

export interface StaffGroup {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  members: StaffMember[];
}

export interface Partner {
  id: number;
  name: string;
  slug: string;
  partner_type: 'host' | 'funder' | 'academic' | 'industry' | 'public_sector' | 'professional_body' | 'other';
  description: string | null;
  website_url: string | null;
  logo?: Media | null;
}

export interface CpdSession {
  id: number;
  programme_id: number;
  label: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  delivery_mode: 'in_person' | 'online' | 'hybrid';
  fee_text: string | null;
  capacity: number | null;
  registration_status: 'open' | 'closed' | 'full' | 'cancelled';
  registration_url: string | null;
  allow_online_registration: boolean;
  programme?: Pick<CpdProgramme, 'id' | 'title' | 'slug' | 'summary' | 'image'>;
}

export interface CpdProgramme extends Seo {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  description?: string | null;
  target_audience: string | null;
  learning_objectives: string | null;
  facilitators: string | null;
  duration: string | null;
  delivery_format: string | null;
  fee_text: string | null;
  registration_url: string | null;
  image?: Media | null;
  sessions: CpdSession[];
}

export type EventType =
  | 'workshop'
  | 'conference'
  | 'summit'
  | 'lecture'
  | 'training'
  | 'meeting'
  | 'webinar'
  | 'forum'
  | 'call_for_papers'
  | 'other';

export interface EventItem extends Seo {
  id: number;
  title: string;
  slug: string;
  event_type: EventType;
  summary: string | null;
  body?: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  venue: string | null;
  location_type: 'in_person' | 'online' | 'hybrid';
  cost_text: string | null;
  registration_url: string | null;
  website_url: string | null;
  image?: Media | null;
  attachments?: Array<{ id: number; label: string | null; media: Media | null }>;
  gallery?: Gallery | null;
}

export interface Newsletter {
  id: number;
  issue_number: number | null;
  title: string;
  slug: string;
  published_on: string | null;
  summary: string | null;
  highlights: string | null;
  online_url: string | null;
  coverImage?: Media | null;
  file?: Media | null;
}

export interface Gallery {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  published_at?: string;
  coverImage?: Media | null;
  items?: Array<{ id: number; caption: string | null; media: Media | null }>;
}

export interface HomeData {
  slides: Slide[];
  news: ArticleSummary[];
  announcements: ArticleSummary[];
  publications: Publication[];
  upcomingEvents: EventItem[];
  upcomingCpdSessions: CpdSession[];
  researchThemes: ResearchTheme[];
  partners: Partner[];
  latestLmi: LmiReport | null;
}

export interface SearchResult {
  type: 'news' | 'publication' | 'event' | 'page' | 'research' | 'training';
  title: string;
  url: string;
  snippet: string;
  date: string | number | null;
}

export interface SearchResponse {
  data: { query: string; type: string; results: SearchResult[]; counts: Record<string, number> };
  meta: PageMeta;
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Array<{ path: string; message: string }>; details?: unknown };
}

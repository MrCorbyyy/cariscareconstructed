import type { ArticleType, EventType, PublicationType } from '@/types/api';

const TZ = 'Africa/Accra';

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ, ...opts }).format(d);
}

export const formatShortDate = (v: string | null | undefined) => formatDate(v, { month: 'short' });

export function formatTime(value: string | null | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }).format(
    new Date(value),
  );
}

/** "9 July 2026", "6–8 July 2026", "30 June – 2 July 2026", plus times for timed single-day events. */
export function formatDateRange(start: string, end?: string | null, allDay = false) {
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const sameDay = !e || formatDate(s) === formatDate(e);
  let text: string;
  if (sameDay) text = formatDate(s);
  else if (s.getUTCFullYear() === e!.getUTCFullYear() && s.getUTCMonth() === e!.getUTCMonth()) {
    text = `${s.getUTCDate()}–${formatDate(e)}`;
  } else {
    text = `${formatDate(s, { year: s.getUTCFullYear() === e!.getUTCFullYear() ? undefined : 'numeric' })} – ${formatDate(e)}`;
  }
  const hasTime = !allDay && !(s.getUTCHours() === 0 && s.getUTCMinutes() === 0);
  if (hasTime && sameDay) {
    text += `, ${formatTime(start)}${e && e.getTime() !== s.getTime() ? ` – ${formatTime(end!)}` : ''} GMT`;
  }
  return text;
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fileTypeLabel(mime?: string | null) {
  if (!mime) return 'File';
  if (mime === 'application/pdf') return 'PDF';
  if (mime.includes('word')) return 'Word';
  if (mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv') return 'Spreadsheet';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'Slides';
  if (mime.startsWith('image/')) return 'Image';
  return 'File';
}

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  news: 'News',
  press_release: 'Press release',
  announcement: 'Announcement',
  call: 'Call for applications',
  research_highlight: 'Research highlight',
  project_update: 'Project update',
  story: 'Profile story',
  newsletter_announcement: 'Newsletter',
};

export const PUBLICATION_TYPE_LABELS: Record<PublicationType, string> = {
  research_report: 'Research report',
  industry_report: 'Industry report',
  policy_brief: 'Policy brief',
  journal_article: 'Journal article',
  working_paper: 'Working paper',
  research_summary: 'Research summary',
  book: 'Book',
  conference_paper: 'Conference paper',
  other: 'Resource',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  workshop: 'Workshop',
  conference: 'Conference',
  summit: 'Summit',
  lecture: 'Lecture',
  training: 'Training',
  meeting: 'Meeting',
  webinar: 'Webinar',
  forum: 'Forum',
  call_for_papers: 'Call for papers',
  other: 'Event',
};

export const DELIVERY_LABELS = { in_person: 'In person', online: 'Online', hybrid: 'In person & online' } as const;

export const isExternal = (href: string) => /^https?:\/\//i.test(href);

export function truncate(text: string | null | undefined, max = 180) {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, text.lastIndexOf(' ', max)).trimEnd()}…`;
}

export const stripTags = (html: string | null | undefined) =>
  (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

'use client';

import Link from 'next/link';
import { BookOpen, CalendarDays, FilePen, GraduationCap, Inbox, Newspaper, Plus, Send } from 'lucide-react';
import { AdminPageHeader } from '@/features/admin/AdminShell';
import { useAuth } from '@/features/admin/AuthContext';
import { ErrorNotice, Panel, Spinner, btn, useLoader } from '@/features/admin/ui';
import { admin } from '@/services/admin';

interface Dashboard {
  counts: {
    publishedArticles: number;
    draftArticles: number;
    articlesInReview: number;
    publications: number;
    upcomingEvents: number;
    upcomingCpdSessions: number;
    newContactSubmissions: number | null;
  };
  recentActivity: Array<{ id: number; action: string; entity_type: string | null; entity_id: string | null; summary: string | null; user_email: string | null; created_at: string }>;
}

const ENTITY_LINKS: Record<string, string> = {
  article: 'articles',
  page: 'pages',
  publication: 'publications',
  event: 'events',
  slide: 'slides',
  staff_profile: 'staff',
  partner: 'partners',
  cpd_programme: 'cpd-programmes',
  newsletter: 'newsletters',
  lmi_report: 'lmi-reports',
  research_project: 'research-projects',
  gallery: 'galleries',
};

export default function DashboardPage() {
  const { session, can } = useAuth();
  const { data, error, loading, reload } = useLoader(() => admin.get<Dashboard>('/admin/dashboard'), []);
  const c = data?.counts;
  const tiles = c
    ? [
        { label: 'Published articles', value: c.publishedArticles, icon: Newspaper, href: '/admin/articles?status=published' },
        { label: 'Draft articles', value: c.draftArticles, icon: FilePen, href: '/admin/articles' },
        { label: 'Awaiting review', value: c.articlesInReview, icon: Send, href: '/admin/articles' },
        { label: 'Publications', value: c.publications, icon: BookOpen, href: '/admin/publications' },
        { label: 'Upcoming events', value: c.upcomingEvents, icon: CalendarDays, href: '/admin/events' },
        { label: 'Upcoming CPD sessions', value: c.upcomingCpdSessions, icon: GraduationCap, href: '/admin/cpd-sessions' },
        ...(c.newContactSubmissions !== null ? [{ label: 'New contact messages', value: c.newContactSubmissions, icon: Inbox, href: '/admin/submissions' }] : []),
      ]
    : [];

  return (
    <>
      <AdminPageHeader
        title={`Welcome, ${session.user.name.split(' ')[0]}`}
        description="Overview of website content and activity."
        actions={
          <>
            {can('articles.create') && (
              <Link href="/admin/articles/new" className={btn.primary}>
                <Plus aria-hidden className="size-4" /> New article
              </Link>
            )}
            {can('events.create') && (
              <Link href="/admin/events/new" className={btn.secondary}>
                <Plus aria-hidden className="size-4" /> New event
              </Link>
            )}
          </>
        }
      />
      {error && <ErrorNotice error={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      {data && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tiles.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="flex items-center gap-4 rounded-(--radius-card) border border-line bg-white p-5 hover:border-brand-300">
                  <span className="flex size-11 items-center justify-center rounded bg-brand-50 text-brand-700">
                    <t.icon aria-hidden className="size-5" />
                  </span>
                  <span>
                    <span className="block font-display text-2xl font-bold text-ink">{t.value}</span>
                    <span className="block text-sm text-muted">{t.label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {data.recentActivity.length > 0 && (
            <Panel title="Recent changes" className="mt-6" actions={can('audit.read') ? <Link href="/admin/audit" className={btn.link}>Full audit log</Link> : undefined}>
              <ol className="divide-y divide-line text-sm">
                {data.recentActivity.map((a) => {
                  const res = a.entity_type ? ENTITY_LINKS[a.entity_type] : undefined;
                  return (
                    <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                      <span>
                        <span className="font-semibold capitalize text-ink">{a.action.replace('status:', 'set to ')}</span> {a.entity_type?.replace(/_/g, ' ')}{' '}
                        {res && a.entity_id && a.action !== 'delete' ? (
                          <Link href={`/admin/${res}/${a.entity_id}`} className={btn.link}>
                            {a.summary}
                          </Link>
                        ) : (
                          <span className="text-body">{a.summary}</span>
                        )}
                      </span>
                      <span className="text-xs text-muted">
                        {a.user_email} · {new Date(a.created_at).toLocaleString('en-GB')}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          )}
        </>
      )}
    </>
  );
}

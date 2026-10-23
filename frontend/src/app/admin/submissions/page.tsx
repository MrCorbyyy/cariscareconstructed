'use client';

import { InboxList } from '@/features/admin/InboxList';

const date = (v: unknown) => new Date(String(v)).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function SubmissionsPage() {
  return (
    <InboxList
      title="Contact submissions"
      description="Messages from the contact form and programme-interest forms (e.g. ISCEA). Private: visible only to authorised administrators."
      api="/submissions"
      permission="submissions"
      exportName="contact-submissions"
      states={['new', 'read', 'replied', 'archived', 'spam']}
      columns={[
        { label: 'Received', render: (r) => <span className="whitespace-nowrap">{date(r.created_at)}</span> },
        {
          label: 'From',
          render: (r) => (
            <>
              <span className="font-semibold text-ink">{String(r.name)}</span>
              <a href={`mailto:${String(r.email)}`} className="block text-brand-700 hover:underline">
                {String(r.email)}
              </a>
            </>
          ),
        },
        { label: 'Topic', render: (r) => String(r.topic).replace(/_/g, ' ') },
        { label: 'Subject', render: (r) => String(r.subject ?? '—') },
      ]}
      renderDetail={(r) => {
        let details: Record<string, string> = {};
        try {
          details = r.details ? JSON.parse(String(r.details)) : {};
        } catch {
          /* ignore malformed */
        }
        return (
          <div className="space-y-2 text-sm">
            {r.organisation ? <p><strong>Organisation:</strong> {String(r.organisation)}</p> : null}
            {r.phone ? <p><strong>Phone:</strong> {String(r.phone)}</p> : null}
            {Object.entries(details).map(([k, v]) => (
              <p key={k}>
                <strong>{k}:</strong> {v}
              </p>
            ))}
            <p className="whitespace-pre-line rounded border border-line bg-white p-3">{String(r.message)}</p>
            <a href={`mailto:${String(r.email)}?subject=${encodeURIComponent(`Re: ${String(r.subject ?? 'Your message to CARISCA')}`)}`} className="font-semibold text-brand-700 hover:underline">
              Reply by email
            </a>
          </div>
        );
      }}
    />
  );
}

'use client';

import { InboxList } from '@/features/admin/InboxList';

const date = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString('en-GB', { dateStyle: 'medium' }) : '—');

export default function SubscribersPage() {
  return (
    <InboxList
      title="Newsletter subscribers"
      description="People who consented to receive the CARISCA newsletter. Export the list to send newsletters through your email service; honour unsubscribes."
      api="/subscribers"
      permission="subscribers"
      exportName="newsletter-subscribers"
      states={['pending', 'subscribed', 'unsubscribed']}
      settable={['subscribed', 'unsubscribed']}
      columns={[
        { label: 'Email', render: (r) => <span className="font-semibold text-ink">{String(r.email)}</span> },
        { label: 'Source', render: (r) => String(r.source ?? '—') },
        { label: 'Consented', render: (r) => date(r.consented_at) },
        { label: 'Confirmed', render: (r) => date(r.confirmed_at) },
      ]}
    />
  );
}

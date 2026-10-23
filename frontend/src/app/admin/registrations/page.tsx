'use client';

import { InboxList } from '@/features/admin/InboxList';

interface RegRow {
  session?: { starts_at: string; label: string | null; programme?: { title: string } };
}

export default function RegistrationsPage() {
  return (
    <InboxList
      title="CPD registrations"
      description="Registrations submitted through the website for CPD sessions that accept online registration."
      api="/registrations"
      permission="registrations"
      exportName="cpd-registrations"
      states={['pending', 'confirmed', 'waitlisted', 'cancelled']}
      columns={[
        { label: 'Registered', render: (r) => new Date(String(r.created_at)).toLocaleDateString('en-GB', { dateStyle: 'medium' }) },
        {
          label: 'Participant',
          render: (r) => (
            <>
              <span className="font-semibold text-ink">{String(r.full_name)}</span>
              <span className="block text-muted">{String(r.email)}</span>
            </>
          ),
        },
        {
          label: 'Programme',
          render: (r) => {
            const s = (r as RegRow).session;
            return s ? (
              <>
                {s.programme?.title}
                <span className="block text-xs text-muted">{new Date(s.starts_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</span>
              </>
            ) : (
              '—'
            );
          },
        },
        { label: 'Organisation', render: (r) => String(r.organisation ?? '—') },
      ]}
      renderDetail={(r) => (
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="font-semibold">Phone</dt>
          <dd>{String(r.phone ?? '—')}</dd>
          <dt className="font-semibold">Job title</dt>
          <dd>{String(r.job_title ?? '—')}</dd>
          <dt className="font-semibold">Attendance</dt>
          <dd>{String(r.attendance_mode ?? '—').replace('_', ' ')}</dd>
          <dt className="font-semibold">Notes</dt>
          <dd className="whitespace-pre-line">{String(r.notes ?? '—')}</dd>
        </dl>
      )}
    />
  );
}

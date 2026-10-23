'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/features/admin/AdminShell';
import { AdminPagination } from '@/features/admin/AdminPagination';
import { ErrorNotice, Spinner, btn, inputCls, useLoader } from '@/features/admin/ui';
import { admin, qs } from '@/services/admin';

interface Log {
  id: number;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  changes: string | null;
  created_at: string;
}

const ACTIONS = ['create', 'update', 'publish', 'delete', 'restore', 'login', 'login_failed', 'logout', 'upload', 'replace_file', 'role_change', 'settings_update', 'export', 'password_change', 'password_set_by_admin'];

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const { data, error, loading, reload } = useLoader(() => admin.list<Log>(`/admin/audit-logs${qs({ page, pageSize: 50, action, q: search })}`), [page, action, search]);

  return (
    <>
      <AdminPageHeader title="Audit log" crumbs={[{ label: 'Audit log' }]} description="A record of sign-ins and administrative changes. Passwords and tokens are never recorded." />
      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-(--radius-card) border border-line bg-white p-4" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q); }}>
        <div className="min-w-56 flex-1">
          <label htmlFor="a-q" className="mb-1 block text-xs font-semibold text-muted">
            Search summary or user
          </label>
          <input id="a-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="a-action" className="mb-1 block text-xs font-semibold text-muted">
            Action
          </label>
          <select id="a-action" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={btn.secondary}>
          Search
        </button>
      </form>
      {error && <ErrorNotice error={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      {data && (
        <div className="overflow-x-auto rounded-(--radius-card) border border-line bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Audit log entries</caption>
            <thead className="border-b border-line bg-surface text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-3 py-3">When</th>
                <th scope="col" className="px-3 py-3">User</th>
                <th scope="col" className="px-3 py-3">Action</th>
                <th scope="col" className="px-3 py-3">Item</th>
                <th scope="col" className="px-3 py-3"><span className="sr-only">Changes</span></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((l) => (
                <tr key={l.id} className="border-b border-line align-top last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString('en-GB')}</td>
                  <td className="px-3 py-2">{l.user_email ?? '—'}</td>
                  <td className="px-3 py-2 font-semibold capitalize">{l.action.replace(/_/g, ' ').replace('status:', 'status → ')}</td>
                  <td className="px-3 py-2">
                    <span className="text-muted">{l.entity_type?.replace(/_/g, ' ')}</span> {l.summary}
                    {open === l.id && l.changes && <pre className="mt-2 max-w-2xl overflow-x-auto rounded bg-surface p-2 text-xs">{JSON.stringify(JSON.parse(l.changes), null, 2)}</pre>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {l.changes && (
                      <button type="button" className={btn.link} aria-expanded={open === l.id} onClick={() => setOpen(open === l.id ? null : l.id)}>
                        {open === l.id ? 'Hide' : 'Changes'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <AdminPagination meta={data.meta} onPage={setPage} />}
    </>
  );
}

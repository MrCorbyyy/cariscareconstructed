'use client';

import { Download, Search } from 'lucide-react';
import { Fragment, useState, type ReactNode } from 'react';
import { admin, qs } from '@/services/admin';
import { ClientApiError } from '@/services/client';
import { AdminPageHeader } from './AdminShell';
import { AdminPagination } from './AdminPagination';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { ConfirmButton, ErrorNotice, Spinner, StatusBadge, btn, inputCls, useLoader } from './ui';

type Row = Record<string, unknown> & { id: number; status: string };

/**
 * Shared screen for private inbound data (contact messages, subscribers, registrations).
 * These records are never exposed by the public API.
 */
export function InboxList({
  title,
  description,
  api,
  permission,
  states,
  columns,
  renderDetail,
  exportName,
  extraFilters,
  settable,
}: {
  title: string;
  description: string;
  api: string;
  permission: string;
  states: string[];
  columns: Array<{ label: string; render: (r: Row) => ReactNode }>;
  renderDetail?: (r: Row) => ReactNode;
  exportName: string;
  extraFilters?: Record<string, string>;
  /** Statuses an admin may set (defaults to all states). */
  settable?: string[];
}) {
  const { can } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [state, setState] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const params = { page, pageSize: 25, state, q: search, ...extraFilters };
  const { data, error, loading, reload } = useLoader(() => admin.list<Row>(`/admin${api}${qs(params)}`), [api, page, state, search, JSON.stringify(extraFilters)]);

  const setStatus = async (row: Row, status: string) => {
    try {
      await admin.patch(`/admin${api}/${row.id}`, { status });
      toast('success', `Marked as ${status}.`);
      void reload();
    } catch (e) {
      toast('error', e instanceof ClientApiError ? e.message : 'Update failed');
    }
  };

  return (
    <>
      <AdminPageHeader
        title={title}
        description={description}
        crumbs={[{ label: title }]}
        actions={
          <button type="button" className={btn.secondary} onClick={() => void admin.download(`/admin${api}${qs({ ...params, page: undefined, pageSize: undefined, format: 'csv' })}`, `${exportName}.csv`).catch(() => toast('error', 'Export failed'))}>
            <Download aria-hidden className="size-4" /> Export CSV
          </button>
        }
      />
      <form
        role="search"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-(--radius-card) border border-line bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="ib-q" className="mb-1 block text-xs font-semibold text-muted">
            Search
          </label>
          <div className="relative">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input id="ib-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
        </div>
        <div>
          <label htmlFor="ib-state" className="mb-1 block text-xs font-semibold text-muted">
            Status
          </label>
          <select id="ib-state" value={state} onChange={(e) => { setState(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">All</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
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
          {data.data.length === 0 ? (
            <p className="p-10 text-center text-muted">Nothing here yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{title}</caption>
              <thead className="border-b border-line bg-surface text-xs tracking-wide text-muted uppercase">
                <tr>
                  {columns.map((c) => (
                    <th key={c.label} scope="col" className="px-3 py-3">
                      {c.label}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((r) => (
                  <Fragment key={r.id}>
                    <tr className="border-b border-line last:border-0">
                      {columns.map((c) => (
                        <td key={c.label} className="px-3 py-2.5 align-top">
                          {c.render(r)}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 align-top">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-2.5 text-right align-top whitespace-nowrap">
                        {renderDetail && (
                          <button type="button" className={`${btn.link} mr-3`} aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
                            {open === r.id ? 'Hide' : 'View'}
                          </button>
                        )}
                        {can(`${permission}.update`) && (
                          <select aria-label="Change status" value="" onChange={(e) => e.target.value && void setStatus(r, e.target.value)} className="mr-3 rounded border border-line px-2 py-1 text-xs">
                            <option value="">Set status…</option>
                            {(settable ?? states).filter((s) => s !== r.status).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                        {can(`${permission}.delete`) && (
                          <ConfirmButton
                            className="font-semibold text-danger hover:underline"
                            title="Delete permanently?"
                            message="This personal data will be permanently deleted."
                            confirmLabel="Delete"
                            onConfirm={async () => {
                              await admin.del(`/admin${api}/${r.id}`);
                              toast('success', 'Deleted.');
                              void reload();
                            }}
                          >
                            Delete
                          </ConfirmButton>
                        )}
                      </td>
                    </tr>
                    {renderDetail && open === r.id && (
                      <tr className="border-b border-line bg-surface">
                        <td colSpan={columns.length + 2} className="px-4 py-4">
                          {renderDetail(r)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {data && <AdminPagination meta={data.meta} onPage={setPage} />}
    </>
  );
}

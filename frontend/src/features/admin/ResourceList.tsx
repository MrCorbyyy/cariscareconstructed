'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { admin, qs } from '@/services/admin';
import { ClientApiError } from '@/services/client';
import { AdminPageHeader } from './AdminShell';
import { AdminPagination } from './AdminPagination';
import { useAuth } from './AuthContext';
import type { ResourceDef } from './resources';
import { useToast } from './Toast';
import { ConfirmButton, ErrorNotice, ReviewFlag, Spinner, StatusBadge, btn, getPath, inputCls, useLoader } from './ui';

type Row = Record<string, unknown> & { id: number };

function Cell({ row, col }: { row: Row; col: ResourceDef['columns'][number] }) {
  const v = getPath(row, col.key);
  switch (col.format) {
    case 'image': {
      const m = v as { url?: string } | null;
      return m?.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
        <img src={m.url} alt="" className="size-11 rounded object-cover" loading="lazy" />
      ) : (
        <span className="block size-11 rounded border border-dashed border-line bg-surface" title="No image (placeholder shown on site)" />
      );
    }
    case 'status':
      return <StatusBadge status={String(v)} publishedAt={row.published_at as string | null} />;
    case 'date':
      return <span className="whitespace-nowrap">{v ? formatDate(String(v), { month: 'short' }) : '—'}</span>;
    case 'datetime':
      return <span className="whitespace-nowrap">{v ? `${formatDate(String(v), { month: 'short' })}` : '—'}</span>;
    case 'label':
      return <>{col.labels?.[String(v)] ?? String(v ?? '—')}</>;
    case 'boolean':
      return <>{v ? 'Yes' : 'No'}</>;
    default:
      return <>{v == null || v === '' ? '—' : String(v)}</>;
  }
}

export function ResourceList({ def }: { def: ResourceDef }) {
  const { can } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, error, loading, reload } = useLoader(
    () => admin.list<Row>(`/admin${def.api}${qs({ page, pageSize: def.sortable ? 100 : 25, q: search, status, ...filters })}`),
    [def.api, page, search, status, JSON.stringify(filters)],
  );
  const canCreate = can(`${def.permission}.create`);
  const canDelete = can(`${def.permission}.delete`);
  const canReorder = def.sortable && can(`${def.permission}.update`) && !search && !status && !Object.values(filters).some(Boolean);

  const move = async (index: number, dir: -1 | 1) => {
    if (!data) return;
    const ids = data.data.map((r) => r.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await admin.post(`/admin${def.api}/reorder`, { ids });
      await reload();
    } catch (e) {
      toast('error', e instanceof ClientApiError ? e.message : 'Reorder failed');
    }
  };

  return (
    <>
      <AdminPageHeader
        title={def.label}
        description={def.description}
        crumbs={[{ label: def.label }]}
        actions={
          canCreate && (
            <Link href={`/admin/${def.key}/new`} className={btn.primary}>
              <Plus aria-hidden className="size-4" /> New {def.singular}
            </Link>
          )
        }
      />
      <form
        role="search"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-(--radius-card) border border-line bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="list-q" className="mb-1 block text-xs font-semibold text-muted">
            Search
          </label>
          <div className="relative">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input id="list-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} pl-9`} placeholder={`Search ${def.label.toLowerCase()}`} />
          </div>
        </div>
        {def.publishable && (
          <div>
            <label htmlFor="list-status" className="mb-1 block text-xs font-semibold text-muted">
              Status
            </label>
            <select id="list-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputCls}>
              <option value="">All statuses</option>
              {['draft', 'review', 'published', 'scheduled', 'archived'].map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
        {def.filters?.map((f) => (
          <div key={f.param}>
            <label htmlFor={`f-${f.param}`} className="mb-1 block text-xs font-semibold text-muted">
              {f.label}
            </label>
            <select id={`f-${f.param}`} value={filters[f.param] ?? ''} onChange={(e) => { setFilters((x) => ({ ...x, [f.param]: e.target.value })); setPage(1); }} className={inputCls}>
              <option value="">All</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button type="submit" className={btn.secondary}>
          Search
        </button>
      </form>

      {error && <ErrorNotice error={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      {data && (
        <div className="overflow-x-auto rounded-(--radius-card) border border-line bg-white">
          {data.data.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-ink">{search || status ? 'Nothing matches these filters.' : `No ${def.label.toLowerCase()} yet.`}</p>
              {canCreate && !search && (
                <Link href={`/admin/${def.key}/new`} className={`${btn.primary} mt-4`}>
                  <Plus aria-hidden className="size-4" /> Create the first {def.singular}
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{def.label}</caption>
              <thead className="border-b border-line bg-surface text-xs tracking-wide text-muted uppercase">
                <tr>
                  {canReorder && <th scope="col" className="w-20 px-3 py-3"><span className="sr-only">Order</span></th>}
                  {def.columns.map((c) => (
                    <th key={c.key} scope="col" className="px-3 py-3 font-semibold">
                      {c.label || <span className="sr-only">Image</span>}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-60' : ''}>
                {data.data.map((row, i) => {
                  const title = String(getPath(row, def.titleField) ?? `#${row.id}`);
                  const url = def.publicUrl?.(row);
                  return (
                    <tr key={row.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                      {canReorder && (
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button type="button" onClick={() => void move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted hover:bg-surface disabled:opacity-30" aria-label={`Move ${title} up`}>
                              <ArrowUp aria-hidden className="size-4" />
                            </button>
                            <button type="button" onClick={() => void move(i, 1)} disabled={i === data.data.length - 1} className="rounded p-1 text-muted hover:bg-surface disabled:opacity-30" aria-label={`Move ${title} down`}>
                              <ArrowDown aria-hidden className="size-4" />
                            </button>
                          </div>
                        </td>
                      )}
                      {def.columns.map((c) => (
                        <td key={c.key} className="px-3 py-2 align-middle">
                          {c.key === def.titleField || (c.key === 'title' && def.titleField !== 'title') ? (
                            <>
                              <Link href={`/admin/${def.key}/${row.id}`} className="font-semibold text-ink hover:text-brand-700 hover:underline">
                                <Cell row={row} col={c} />
                              </Link>
                              <ReviewFlag note={row.review_note as string | null} />
                            </>
                          ) : (
                            <Cell row={row} col={c} />
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <Link href={`/admin/${def.key}/${row.id}`} className={`${btn.link} mr-3`}>
                          Edit<span className="sr-only"> {title}</span>
                        </Link>
                        {url && row.status === 'published' && (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="mr-3 inline-flex items-center gap-1 text-muted hover:text-brand-700" aria-label={`View ${title} on the website (opens in a new tab)`}>
                            <ExternalLink aria-hidden className="size-4" />
                          </a>
                        )}
                        {canDelete && (
                          <ConfirmButton
                            className="font-semibold text-danger hover:underline"
                            title={`Delete ${def.singular}?`}
                            message={<>“{title}” will be removed from the website. Deleted content can be restored by a developer from the database.</>}
                            confirmLabel="Delete"
                            onConfirm={async () => {
                              try {
                                await admin.del(`/admin${def.api}/${row.id}`);
                                toast('success', `Deleted “${title}”.`);
                                await reload();
                              } catch (e) {
                                toast('error', e instanceof ClientApiError ? e.message : 'Delete failed');
                              }
                            }}
                          >
                            Delete<span className="sr-only"> {title}</span>
                          </ConfirmButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      {data && <AdminPagination meta={data.meta} onPage={setPage} />}
    </>
  );
}

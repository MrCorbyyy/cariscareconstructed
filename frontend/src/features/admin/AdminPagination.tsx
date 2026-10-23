'use client';

import type { PageMeta } from '@/types/api';

export function AdminPagination({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  if (meta.totalPages <= 1) return <p className="mt-4 text-sm text-muted">{meta.total} item{meta.total === 1 ? '' : 's'}</p>;
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted">
        Page {meta.page} of {meta.totalPages} · {meta.total} items
      </p>
      <div className="flex gap-2">
        <button type="button" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} className="rounded border border-line bg-white px-3 py-1.5 font-semibold disabled:opacity-40">
          Previous
        </button>
        <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} className="rounded border border-line bg-white px-3 py-1.5 font-semibold disabled:opacity-40">
          Next
        </button>
      </div>
    </nav>
  );
}

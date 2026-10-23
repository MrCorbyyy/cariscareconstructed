'use client';

import { Search, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { AdminPageHeader } from '@/features/admin/AdminShell';
import { AdminPagination } from '@/features/admin/AdminPagination';
import { useAuth } from '@/features/admin/AuthContext';
import { MediaThumb, uploadMedia, type AdminMedia } from '@/features/admin/MediaPicker';
import { useToast } from '@/features/admin/Toast';
import { ConfirmButton, ErrorNotice, Spinner, btn, inputCls, useLoader } from '@/features/admin/ui';
import { formatFileSize } from '@/lib/format';
import { admin, qs } from '@/services/admin';
import { ClientApiError } from '@/services/client';

type Detail = AdminMedia & { usages: Array<{ label: string; count: number }> };

function MediaDetail({ id, onChanged, onDeleted }: { id: number; onChanged: () => void; onDeleted: () => void }) {
  const { can } = useAuth();
  const toast = useToast();
  const { data, reload } = useLoader(() => admin.get<Detail>(`/admin/media/${id}`), [id]);
  const [alt, setAlt] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  if (!data) return <Spinner />;
  const editable = can('media.update');

  const saveMeta = async () => {
    try {
      await admin.patch(`/admin/media/${id}`, { alt_text: alt ?? data.alt_text, caption: caption ?? data.caption, title: title ?? data.title });
      toast('success', 'File details saved.');
      onChanged();
      void reload();
    } catch (e) {
      toast('error', e instanceof ClientApiError ? e.message : 'Save failed');
    }
  };
  const replace = async () => {
    const file = replaceRef.current?.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      await admin.upload(`/admin/media/${id}/replace`, form);
      toast('success', 'File replaced everywhere it is used.');
      onChanged();
      void reload();
    } catch (e) {
      toast('error', e instanceof ClientApiError ? e.message : 'Replace failed');
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <MediaThumb m={data} className="aspect-video w-full object-contain" />
      <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted">File</dt>
        <dd className="break-all">{data.original_name}</dd>
        <dt className="text-muted">Type</dt>
        <dd>{data.mime_type}</dd>
        <dt className="text-muted">Size</dt>
        <dd>
          {formatFileSize(data.size_bytes)}
          {data.width ? ` · ${data.width} × ${data.height} px` : ''}
        </dd>
        <dt className="text-muted">Used in</dt>
        <dd>{data.usages.length ? data.usages.map((u) => `${u.label} (${u.count})`).join(', ') : 'Not used'}</dd>
      </dl>
      {data.url && (
        <p>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className={btn.link}>
            Open file
          </a>
        </p>
      )}
      <fieldset disabled={!editable} className="space-y-3">
        <div>
          <label htmlFor="m-title" className="mb-1 block font-semibold">
            Title
          </label>
          <input id="m-title" className={inputCls} value={title ?? data.title ?? ''} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {data.kind === 'image' && (
          <div>
            <label htmlFor="m-alt" className="mb-1 block font-semibold">
              Alt text
            </label>
            <textarea id="m-alt" rows={2} className={inputCls} value={alt ?? data.alt_text ?? ''} onChange={(e) => setAlt(e.target.value)} />
            <p className="mt-1 text-xs text-muted">Describe what the image shows. Leave empty only for purely decorative images.</p>
          </div>
        )}
        <div>
          <label htmlFor="m-cap" className="mb-1 block font-semibold">
            Caption / credit
          </label>
          <input id="m-cap" className={inputCls} value={caption ?? data.caption ?? ''} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <button type="button" onClick={() => void saveMeta()} className={btn.primary}>
          Save details
        </button>
      </fieldset>
      {editable && (
        <div className="rounded border border-line bg-surface p-3">
          <label htmlFor="m-replace" className="mb-1 block font-semibold">
            Replace file
          </label>
          <p className="mb-2 text-xs text-muted">Upload a new version; every page using this file updates automatically (e.g. to replace a placeholder or correct a report).</p>
          <input id="m-replace" ref={replaceRef} type="file" className="text-xs" />
          <button type="button" onClick={() => void replace()} className={`${btn.secondary} mt-2`}>
            Replace
          </button>
        </div>
      )}
      {can('media.delete') && (
        <ConfirmButton
          className={btn.danger}
          title="Delete this file?"
          message={data.usages.length ? 'This file is still used and cannot be deleted until it is removed from that content.' : 'The file will be permanently deleted.'}
          confirmLabel="Delete"
          onConfirm={async () => {
            try {
              await admin.del(`/admin/media/${id}`);
              toast('success', 'File deleted.');
              onDeleted();
            } catch (e) {
              toast('error', e instanceof ClientApiError ? e.message : 'Delete failed');
            }
          }}
        >
          Delete file
        </ConfirmButton>
      )}
    </div>
  );
}

export default function MediaLibraryPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [alt, setAlt] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, error, loading, reload } = useLoader(() => admin.list<AdminMedia>(`/admin/media${qs({ page, pageSize: 30, q: search, kind })}`), [page, search, kind]);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast('error', 'Choose a file first.');
    setBusy(true);
    try {
      const m = await uploadMedia(file, { alt_text: alt || undefined });
      toast('success', `Uploaded ${m.original_name}.`);
      setAlt('');
      if (fileRef.current) fileRef.current.value = '';
      setSelected(m.id);
      void reload();
    } catch (e) {
      toast('error', e instanceof ClientApiError ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminPageHeader title="Media library" crumbs={[{ label: 'Media library' }]} description="Images and documents used across the website. Allowed: JPG, PNG, WebP, GIF, SVG (no scripts), PDF, Word, Excel, PowerPoint, CSV." />
      {can('media.create') && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-(--radius-card) border border-line bg-white p-4">
          <div>
            <label htmlFor="up-file" className="mb-1 block text-xs font-semibold text-muted">
              File
            </label>
            <input id="up-file" ref={fileRef} type="file" className="text-sm" />
          </div>
          <div className="min-w-64 flex-1">
            <label htmlFor="up-alt" className="mb-1 block text-xs font-semibold text-muted">
              Alt text (images)
            </label>
            <input id="up-alt" value={alt} onChange={(e) => setAlt(e.target.value)} className={inputCls} />
          </div>
          <button type="button" disabled={busy} onClick={() => void upload()} className={btn.primary}>
            <Upload aria-hidden className="size-4" /> {busy ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      )}
      <form
        className="mb-4 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <label htmlFor="ml-q" className="sr-only">
          Search
        </label>
        <div className="relative min-w-64 flex-1">
          <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input id="ml-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} pl-9`} placeholder="Search files" />
        </div>
        <label htmlFor="ml-kind" className="sr-only">
          Type
        </label>
        <select id="ml-kind" value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }} className={`${inputCls} w-40`}>
          <option value="">All files</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
        </select>
        <button type="submit" className={btn.secondary}>
          Search
        </button>
      </form>
      {error && <ErrorNotice error={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          {data && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {data.data.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m.id)}
                    aria-pressed={selected === m.id}
                    className={`w-full rounded border bg-white p-2 text-left ${selected === m.id ? 'border-brand-600 ring-2 ring-brand-200' : 'border-line hover:border-brand-300'}`}
                  >
                    <MediaThumb m={m} className="aspect-square w-full" />
                    <span className="mt-1.5 block truncate text-xs font-medium">{m.title || m.original_name}</span>
                    <span className="block text-[0.7rem] text-muted">
                      {m.kind === 'image' && !m.alt_text ? <span className="text-warning">No alt text · </span> : ''}
                      {formatFileSize(m.size_bytes)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && <AdminPagination meta={data.meta} onPage={setPage} />}
        </div>
        <aside className="rounded-(--radius-card) border border-line bg-white p-4 lg:sticky lg:top-20 lg:self-start">
          {selected ? (
            <MediaDetail
              key={selected}
              id={selected}
              onChanged={() => void reload()}
              onDeleted={() => {
                setSelected(null);
                void reload();
              }}
            />
          ) : (
            <p className="text-sm text-muted">Select a file to see details, edit alt text, replace or delete it.</p>
          )}
        </aside>
      </div>
    </>
  );
}

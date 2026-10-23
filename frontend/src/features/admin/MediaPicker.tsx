'use client';

import { FileText, Search, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import slots from '@/lib/image-slots.json';
import { formatFileSize } from '@/lib/format';
import { admin, qs } from '@/services/admin';
import { ClientApiError } from '@/services/client';
import type { ImageSlot } from '@/components/ui/CmsImage';
import { AdminPagination } from './AdminPagination';
import { useAuth } from './AuthContext';
import { Spinner, btn, inputCls, useLoader } from './ui';

export interface AdminMedia {
  id: number;
  url: string | null;
  kind: 'image' | 'document' | 'video' | 'other';
  visibility: 'public' | 'private';
  original_name: string;
  title: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  created_at: string;
}

export function MediaThumb({ m, className = 'size-16' }: { m: AdminMedia; className?: string }) {
  if (m.kind === 'image' && m.url) {
    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
    return <img src={m.url} alt={m.alt_text ?? ''} className={`${className} rounded border border-line bg-surface object-cover`} loading="lazy" />;
  }
  return (
    <span className={`${className} flex items-center justify-center rounded border border-line bg-surface text-brand-600`}>
      <FileText aria-hidden className="size-6" />
    </span>
  );
}

/** Uploads one file with optional alt text; returns the created media record. */
export async function uploadMedia(file: File, meta: { alt_text?: string; title?: string } = {}) {
  const form = new FormData();
  form.append('file', file);
  if (meta.alt_text) form.append('alt_text', meta.alt_text);
  if (meta.title) form.append('title', meta.title);
  return admin.upload<AdminMedia>('/admin/media', form);
}

export function MediaPickerDialog({ kind, slot, onSelect, onClose }: { kind?: 'image' | 'document'; slot?: ImageSlot; onSelect: (m: AdminMedia) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [alt, setAlt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, loading, reload } = useLoader(() => admin.list<AdminMedia>(`/admin/media${qs({ page, pageSize: 24, q: search, kind })}`), [page, search, kind]);
  const guide = slot ? slots[slot] : null;

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const doUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (kind === 'image' && !alt.trim()) {
      setError('Add a short description (alt text) so the image is accessible.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const m = await uploadMedia(file, { alt_text: alt.trim() || undefined });
      onSelect(m);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto h-[min(90vh,52rem)] w-[min(64rem,calc(100vw-2rem))] rounded-(--radius-card) p-0 shadow-(--shadow-raised) backdrop:bg-black/50" aria-label="Choose from the media library">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-lg font-bold">Choose {kind === 'document' ? 'a document' : 'an image'}</h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="rounded p-1 hover:bg-surface">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        {can('media.create') && (
          <div className="border-b border-line bg-surface px-5 py-4">
            {guide && (
              <p className="mb-2 text-sm text-muted">
                Recommended for this slot: <strong className="text-ink">{guide.width} × {guide.height} px</strong> ({guide.ratio}). Images are shown with “{guide.fit}” fitting.
              </p>
            )}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="mp-file" className="mb-1 block text-xs font-semibold text-muted">
                  Upload new
                </label>
                <input id="mp-file" ref={fileRef} type="file" accept={kind === 'document' ? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt' : 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'} className="text-sm" />
              </div>
              {kind !== 'document' && (
                <div className="min-w-60 flex-1">
                  <label htmlFor="mp-alt" className="mb-1 block text-xs font-semibold text-muted">
                    Image description (alt text)
                  </label>
                  <input id="mp-alt" value={alt} onChange={(e) => setAlt(e.target.value)} className={inputCls} placeholder="e.g. Participants at the 2025 Supply Chain Research Summit" />
                </div>
              )}
              <button type="button" onClick={() => void doUpload()} disabled={uploading} className={btn.primary}>
                <Upload aria-hidden className="size-4" /> {uploading ? 'Uploading…' : 'Upload & use'}
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-sm font-medium text-danger">
                {error}
              </p>
            )}
          </div>
        )}
        <form
          className="flex gap-2 px-5 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(q);
          }}
        >
          <label htmlFor="mp-q" className="sr-only">
            Search media
          </label>
          <div className="relative flex-1">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input id="mp-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} pl-9`} placeholder="Search by file name, title or alt text" />
          </div>
          <button type="submit" className={btn.secondary}>
            Search
          </button>
        </form>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && !data && <Spinner />}
          {data && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {data.data.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={!m.url}
                    onClick={() => onSelect(m)}
                    className="group w-full rounded border border-line p-2 text-left hover:border-brand-500 focus-visible:ring-3 focus-visible:ring-brand-200 disabled:opacity-40"
                  >
                    <MediaThumb m={m} className="aspect-square w-full" />
                    <span className="mt-1.5 block truncate text-xs font-medium text-ink">{m.title || m.original_name}</span>
                    <span className="block text-[0.7rem] text-muted">
                      {m.width && m.height ? `${m.width}×${m.height} · ` : ''}
                      {formatFileSize(m.size_bytes)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && data.data.length === 0 && <p className="py-10 text-center text-muted">No files found.</p>}
          {data && <AdminPagination meta={data.meta} onPage={setPage} />}
          <button type="button" onClick={() => void reload()} className="sr-only">
            Refresh
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** Form field holding a media id, showing the current file and slot size guidance. */
export function MediaField({ id, value, onChange, kind = 'image', slot }: { id: string; value: number | null; onChange: (v: number | null) => void; kind?: 'image' | 'document'; slot?: ImageSlot }) {
  const [open, setOpen] = useState(false);
  const [loaded, setMedia] = useState<AdminMedia | null>(null);
  // Only show the loaded record if it matches the current value.
  const media = value && loaded?.id === value ? loaded : null;
  useEffect(() => {
    let cancelled = false;
    if (value && loaded?.id !== value) {
      admin
        .get<AdminMedia>(`/admin/media/${value}`)
        .then((m) => !cancelled && setMedia(m))
        .catch(() => !cancelled && setMedia(null));
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the id changes
  }, [value]);
  const guide = slot ? slots[slot] : null;

  return (
    <div id={id} className="flex flex-wrap items-center gap-4 rounded-(--radius-card) border border-line bg-white p-3">
      {media ? (
        <MediaThumb m={media} className="size-20" />
      ) : (
        <span className="flex size-20 items-center justify-center rounded border border-dashed border-line bg-surface text-center text-[0.65rem] text-muted">{kind === 'image' ? 'Placeholder shown' : 'No file'}</span>
      )}
      <div className="min-w-0 flex-1 text-sm">
        {media ? (
          <>
            <p className="truncate font-semibold text-ink">{media.title || media.original_name}</p>
            <p className="text-muted">
              {media.width && media.height ? `${media.width} × ${media.height} px · ` : ''}
              {formatFileSize(media.size_bytes)}
            </p>
            {kind === 'image' && !media.alt_text && <p className="text-warning">No alt text — add one in the media library.</p>}
          </>
        ) : (
          <p className="text-muted">None selected.</p>
        )}
        {guide && (
          <p className="mt-1 text-xs text-muted">
            Recommended: {guide.width} × {guide.height} px ({guide.ratio})
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(true)} className={btn.secondary}>
          {media ? 'Replace' : 'Choose'}
        </button>
        {media && (
          <button type="button" onClick={() => onChange(null)} className={btn.danger}>
            Remove
          </button>
        )}
      </div>
      {open && (
        <MediaPickerDialog
          kind={kind}
          slot={slot}
          onClose={() => setOpen(false)}
          onSelect={(m) => {
            setMedia(m);
            onChange(m.id);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

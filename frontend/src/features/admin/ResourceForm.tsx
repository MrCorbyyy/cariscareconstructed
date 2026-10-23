'use client';

import { useRouter } from 'next/navigation';
import { Eye, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RichText } from '@/components/ui/Typography';
import { admin } from '@/services/admin';
import { ClientApiError } from '@/services/client';
import { AdminPageHeader } from './AdminShell';
import { useAuth } from './AuthContext';
import { FieldControl, type FormValue } from './FieldControls';
import type { FieldDef, ResourceDef } from './resources';
import { useToast } from './Toast';
import { ErrorNotice, Panel, Spinner, StatusBadge, btn } from './ui';

type Values = Record<string, FormValue>;
type Record_ = Record<string, unknown> & { id: number };

const SECTIONS: Array<{ key: NonNullable<FieldDef['section']>; title: string }> = [
  { key: 'main', title: 'Content' },
  { key: 'media', title: 'Images & files' },
  { key: 'details', title: 'Details' },
  { key: 'publishing', title: 'Publishing' },
  { key: 'seo', title: 'Search & social sharing' },
];

const pad = (n: number) => String(n).padStart(2, '0');
/** ISO → value for <input type="datetime-local"> in the browser's local time. */
const toLocalInput = (iso: unknown) => {
  if (!iso) return null;
  const d = new Date(String(iso));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Converts an API record into form values. */
function toValues(def: ResourceDef, rec: Record_ | null): Values {
  const v: Values = {};
  for (const f of def.fields) {
    const raw = rec?.[f.name];
    if (f.type === 'datetime') v[f.name] = toLocalInput(raw);
    else if (f.type === 'multirelation') v[f.name] = ((rec?.categories as Array<{ id: number }>) ?? []).map((c) => c.id);
    else if (f.type === 'indicators') v[f.name] = ((rec?.indicators as Array<Record<string, unknown>>) ?? []).map(({ indicator, label, value }) => ({ indicator, label, value }));
    else if (f.type === 'mediaList') v[f.name] = ((rec?.attachments as Array<{ media_id: number }>) ?? []).map((a) => a.media_id);
    else if (f.type === 'galleryItems') v[f.name] = ((rec?.items as Array<Record<string, unknown>>) ?? []).map((i) => ({ media_id: i.media_id, caption: i.caption, media: i.media }));
    else if (f.type === 'boolean') v[f.name] = Boolean(raw ?? (f.name === 'is_enabled' || f.name === 'show_in_sitemap'));
    else v[f.name] = raw == null ? null : (raw as FormValue);
  }
  if (!rec) {
    const first = (name: string) => def.fields.find((f) => f.name === name)?.options?.[0]?.value ?? null;
    if (def.fields.some((f) => f.name === 'type')) v.type = first('type');
    if (def.key === 'pages') v.template = 'standard';
    if (def.key === 'redirects') v.status_code = '301';
  }
  return v;
}

/** Converts form values into the API payload. */
function toPayload(def: ResourceDef, values: Values) {
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    let v = values[f.name];
    if (f.type === 'datetime') v = v ? new Date(String(v)).toISOString() : null;
    if (f.type === 'number') v = v === null || v === '' ? null : Number(v);
    if (f.type === 'select' && typeof v === 'string' && f.options?.every((o) => /^\d+$/.test(o.value))) v = Number(v);
    if (f.type === 'galleryItems') v = ((v as Array<Record<string, unknown>>) ?? []).map((i) => ({ media_id: i.media_id, caption: i.caption || null }));
    if (f.type === 'indicators') v = ((v as Array<Record<string, unknown>>) ?? []).filter((i) => i.indicator && i.label && i.value !== '').map((i) => ({ ...i, value: Number(i.value) }));
    out[f.name] = v === '' ? null : v;
  }
  return out;
}

export function ResourceForm({ def, id }: { def: ResourceDef; id: number | null }) {
  const router = useRouter();
  const toast = useToast();
  const { can, session } = useAuth();
  const [record, setRecord] = useState<Record_ | null>(null);
  const [values, setValues] = useState<Values>(() => toValues(def, null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    admin
      .get<Record_>(`/admin${def.api}/${id}`)
      .then((r) => {
        setRecord(r);
        setValues(toValues(def, r));
      })
      .catch((e) => setLoadError(e instanceof ClientApiError ? e.message : 'Failed to load'));
  }, [def, id]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const status = (record?.status as string) ?? 'draft';
  const canPublish = can(`${def.permission}.publish`);
  const ownsRecord = !record || record.created_by === session.user.id;
  const canEdit = id ? can(`${def.permission}.update`) || (can(`${def.permission}.update_own`) && ownsRecord && status !== 'published') : can(`${def.permission}.create`);
  const set = (name: string, v: FormValue) => {
    setValues((x) => ({ ...x, [name]: v }));
    setDirty(true);
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const save = async (nextStatus?: string) => {
    setSaving(true);
    setErrors({});
    const payload: Record<string, unknown> = toPayload(def, values);
    if (def.publishable && nextStatus) payload.status = nextStatus;
    try {
      const saved = id ? await admin.patch<Record_>(`/admin${def.api}/${id}`, payload) : await admin.post<Record_>(`/admin${def.api}`, payload);
      setDirty(false);
      toast('success', nextStatus === 'published' ? 'Published.' : nextStatus === 'review' ? 'Submitted for review.' : 'Saved.');
      if (!id) router.replace(`/admin/${def.key}/${saved.id}`);
      else {
        setRecord(saved);
        setValues(toValues(def, saved));
      }
    } catch (e) {
      if (e instanceof ClientApiError) {
        setErrors(e.fields);
        toast('error', Object.keys(e.fields).length ? 'Please fix the highlighted fields.' : e.message);
        setTimeout(() => summaryRef.current?.focus(), 0);
      } else toast('error', 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => SECTIONS.map((s) => ({ ...s, fields: def.fields.filter((f) => (f.section ?? 'main') === s.key) })).filter((s) => s.fields.length), [def]);
  const errorList = Object.entries(errors).filter(([, m]) => m);
  const title = String(values[def.titleField] ?? record?.[def.titleField] ?? '');
  const publicUrl = record && def.publicUrl?.(record);

  if (loadError) return <ErrorNotice error={loadError} />;
  if (id && !record) return <Spinner />;

  return (
    <>
      <AdminPageHeader
        title={id ? title || `Edit ${def.singular}` : `New ${def.singular}`}
        crumbs={[{ label: def.label, href: `/admin/${def.key}` }, { label: id ? 'Edit' : 'New' }]}
        actions={
          <>
            {def.fields.some((f) => f.type === 'richtext') && (
              <button type="button" className={btn.secondary} onClick={() => setPreview(true)}>
                <Eye aria-hidden className="size-4" /> Preview
              </button>
            )}
            {publicUrl && status === 'published' && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
                View on site <ExternalLink aria-hidden className="size-4" />
              </a>
            )}
          </>
        }
      />

      {record?.review_note ? (
        <p className="mb-4 rounded-(--radius-card) border border-[#f3d9a4] bg-[#fff8ea] px-4 py-3 text-sm text-warning">
          <strong>Needs review:</strong> {String(record.review_note)}
        </p>
      ) : null}
      {!canEdit && <p className="mb-4 rounded-(--radius-card) bg-surface-strong px-4 py-3 text-sm text-muted">You can view this item but not edit it.</p>}

      <div ref={summaryRef} tabIndex={-1} className="outline-none">
        {errorList.length > 0 && (
          <div role="alert" className="mb-4 rounded-(--radius-card) border border-[#f6c9c4] bg-[#fdf0ee] p-4 text-sm text-danger">
            <p className="font-semibold">Please correct the following:</p>
            <ul className="mt-1 list-disc pl-5">
              {errorList.map(([k, m]) => (
                <li key={k}>
                  <a href={`#field-${k}`} className="underline">
                    {def.fields.find((f) => f.name === k)?.label ?? k}: {m}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <fieldset disabled={!canEdit || saving} className="min-w-0 space-y-6">
          {grouped.map((section) => (
            <Panel key={section.key} title={section.title}>
              <div className="space-y-5">
                {section.fields.map((f) => {
                  const fid = `field-${f.name}`;
                  return (
                    <div key={f.name}>
                      <label id={`${fid}-label`} htmlFor={fid} className="mb-1 block text-sm font-semibold text-ink">
                        {f.label}
                        {f.required && <span className="text-danger"> *</span>}
                      </label>
                      <FieldControl field={f} id={fid} labelId={`${fid}-label`} value={values[f.name]} onChange={(v) => set(f.name, v)} error={errors[f.name]} />
                      {f.hint && !errors[f.name] && (
                        <p id={`${fid}-hint`} className="mt-1 text-xs text-muted">
                          {f.hint}
                        </p>
                      )}
                      {errors[f.name] && (
                        <p id={`${fid}-error`} className="mt-1 text-sm font-medium text-danger">
                          {errors[f.name]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>
          ))}
        </fieldset>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Panel title="Save">
            {def.publishable && (
              <p className="mb-4 flex items-center gap-2 text-sm text-muted">
                Status: <StatusBadge status={status} publishedAt={record?.published_at as string | null} />
              </p>
            )}
            {canEdit && (
              <div className="flex flex-col gap-2">
                {def.publishable ? (
                  <>
                    <button type="button" disabled={saving} onClick={() => void save(status === 'published' && canPublish ? 'published' : 'draft')} className={btn.secondary}>
                      {status === 'published' && canPublish ? 'Update' : 'Save draft'}
                    </button>
                    {!canPublish && status !== 'review' && (
                      <button type="button" disabled={saving} onClick={() => void save('review')} className={btn.primary}>
                        Submit for review
                      </button>
                    )}
                    {canPublish && status !== 'published' && (
                      <button type="button" disabled={saving} onClick={() => void save('published')} className={btn.primary}>
                        Publish
                      </button>
                    )}
                    {canPublish && status === 'published' && (
                      <button type="button" disabled={saving} onClick={() => void save('draft')} className={btn.secondary}>
                        Unpublish (back to draft)
                      </button>
                    )}
                    {canPublish && status !== 'archived' && id && (
                      <button type="button" disabled={saving} onClick={() => void save('archived')} className={btn.danger}>
                        Archive
                      </button>
                    )}
                  </>
                ) : (
                  <button type="submit" disabled={saving} className={btn.primary}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
            )}
            {dirty && <p className="mt-3 text-xs text-warning">You have unsaved changes.</p>}
            {record?.updated_at ? <p className="mt-3 text-xs text-muted">Last saved {new Date(String(record.updated_at)).toLocaleString('en-GB')}</p> : null}
          </Panel>
        </aside>
      </form>

      {preview && (
        <div role="dialog" aria-modal="true" aria-label="Preview" className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 md:p-10" onKeyDown={(e) => e.key === 'Escape' && setPreview(false)}>
          <div className="mx-auto max-w-4xl rounded-(--radius-card) bg-white shadow-(--shadow-raised)">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="text-sm font-semibold text-muted">Preview (unsaved changes included; not visible to the public)</p>
              <button type="button" className={btn.secondary} onClick={() => setPreview(false)} autoFocus>
                Close preview
              </button>
            </div>
            <div className="bg-brand-900 px-8 py-10 text-white">
              <h1 className="text-3xl font-bold text-white">{title || 'Untitled'}</h1>
              {['excerpt', 'summary'].map((k) => (values[k] ? <p key={k} className="mt-3 text-lg text-brand-100">{String(values[k])}</p> : null))}
            </div>
            <div className="px-8 py-8">
              {def.fields
                .filter((f) => f.type === 'richtext')
                .map((f) => (
                  <RichText key={f.name} html={String(values[f.name] ?? '')} />
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

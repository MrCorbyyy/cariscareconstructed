'use client';

import { Plus, Trash2 } from 'lucide-react';
import { admin } from '@/services/admin';
import { MediaField, MediaPickerDialog, MediaThumb, type AdminMedia } from './MediaPicker';
import { RichTextEditor } from './RichTextEditor';
import type { FieldDef } from './resources';
import { btn, inputCls, useLoader } from './ui';
import { useState } from 'react';

export type FormValue = string | number | boolean | null | number[] | Array<Record<string, unknown>>;

function RelationSelect({ field, id, value, onChange, multiple }: { field: FieldDef; id: string; value: FormValue; onChange: (v: FormValue) => void; multiple?: boolean }) {
  const { data } = useLoader(() => admin.list<Record<string, unknown> & { id: number }>(`/admin${field.source!.path}`), [field.source!.path]);
  const options = data?.data ?? [];
  if (multiple) {
    const selected = new Set((value as number[] | null) ?? []);
    return (
      <fieldset id={id} className="flex flex-wrap gap-x-5 gap-y-2 rounded-(--radius-card) border border-line bg-white p-3">
        <legend className="sr-only">{field.label}</legend>
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-brand-700"
              checked={selected.has(o.id)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(o.id);
                else next.delete(o.id);
                onChange([...next]);
              }}
            />
            {String(o[field.source!.labelField])}
          </label>
        ))}
        {!options.length && <span className="text-sm text-muted">No options yet.</span>}
      </fieldset>
    );
  }
  return (
    <select id={id} value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className={inputCls}>
      <option value="">— None —</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {String(o[field.source!.labelField])}
        </option>
      ))}
    </select>
  );
}

function IndicatorsEditor({ id, value, onChange }: { id: string; value: FormValue; onChange: (v: FormValue) => void }) {
  const rows = ((value as Array<Record<string, unknown>>) ?? []) as Array<{ indicator: string; label: string; value: string | number }>;
  const update = (i: number, patch: Partial<(typeof rows)[number]>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div id={id} className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_6rem_auto] gap-2">
          <input aria-label="Indicator key" placeholder="inventory_levels" value={r.indicator} onChange={(e) => update(i, { indicator: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={inputCls} />
          <input aria-label="Label" placeholder="Inventory levels" value={r.label} onChange={(e) => update(i, { label: e.target.value })} className={inputCls} />
          <input aria-label="Value" type="number" step="0.1" min={0} max={100} value={r.value} onChange={(e) => update(i, { value: e.target.value })} className={inputCls} />
          <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className={btn.danger} aria-label={`Remove ${r.label || 'indicator'}`}>
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { indicator: '', label: '', value: '' }])} className={btn.secondary}>
        <Plus aria-hidden className="size-4" /> Add indicator
      </button>
    </div>
  );
}

function MediaListEditor({ id, value, onChange, field, withCaptions }: { id: string; value: FormValue; onChange: (v: FormValue) => void; field: FieldDef; withCaptions?: boolean }) {
  const [open, setOpen] = useState(false);
  const [cache, setCache] = useState<Record<number, AdminMedia>>({});
  const items: Array<{ media_id: number; caption?: string | null; media?: AdminMedia }> = withCaptions
    ? ((value as Array<Record<string, unknown>>) ?? []).map((v) => ({ media_id: Number(v.media_id), caption: (v.caption as string) ?? '', media: v.media as AdminMedia | undefined }))
    : ((value as number[]) ?? []).map((mid) => ({ media_id: mid }));
  const emit = (next: typeof items) => onChange(withCaptions ? next.map((i) => ({ media_id: i.media_id, caption: i.caption ?? null, media: i.media })) : next.map((i) => i.media_id));
  const move = (i: number, d: number) => {
    const next = [...items];
    const t = i + d;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    emit(next);
  };
  return (
    <div id={id} className="space-y-2">
      {items.map((item, i) => {
        const m = item.media ?? cache[item.media_id];
        return (
          <div key={`${item.media_id}-${i}`} className="flex items-center gap-3 rounded border border-line bg-white p-2">
            {m ? <MediaThumb m={m} className="size-12" /> : <span className="size-12 rounded bg-surface" />}
            <span className="min-w-0 flex-1 truncate text-sm">{m ? m.title || m.original_name : `File #${item.media_id}`}</span>
            {withCaptions && (
              <input aria-label="Caption" placeholder="Caption" value={item.caption ?? ''} onChange={(e) => emit(items.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} className={`${inputCls} max-w-xs`} />
            )}
            <button type="button" className="rounded px-2 text-muted hover:bg-surface" onClick={() => move(i, -1)} aria-label="Move up">
              ↑
            </button>
            <button type="button" className="rounded px-2 text-muted hover:bg-surface" onClick={() => move(i, 1)} aria-label="Move down">
              ↓
            </button>
            <button type="button" className={btn.danger} onClick={() => emit(items.filter((_, j) => j !== i))} aria-label="Remove">
              <Trash2 aria-hidden className="size-4" />
            </button>
          </div>
        );
      })}
      <button type="button" onClick={() => setOpen(true)} className={btn.secondary}>
        <Plus aria-hidden className="size-4" /> Add {field.media?.kind === 'document' ? 'file' : 'image'}
      </button>
      {open && (
        <MediaPickerDialog
          kind={field.media?.kind}
          slot={field.media?.slot}
          onClose={() => setOpen(false)}
          onSelect={(m) => {
            setCache((c) => ({ ...c, [m.id]: m }));
            emit([...items, { media_id: m.id, caption: '', media: m }]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Renders the input for one field definition. */
export function FieldControl({ field, id, value, onChange, error, labelId }: { field: FieldDef; id: string; value: FormValue; onChange: (v: FormValue) => void; error?: string; labelId: string }) {
  const common = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : field.hint ? `${id}-hint` : undefined } as const;
  switch (field.type) {
    case 'textarea':
      return <textarea {...common} rows={field.max && field.max > 3000 ? 8 : 4} maxLength={field.max} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
    case 'richtext':
      return <RichTextEditor id={id} labelledBy={labelId} value={(value as string) ?? ''} onChange={(v) => onChange(v)} />;
    case 'number':
      return <input {...common} type="number" step="any" value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} className={`${inputCls} max-w-48`} />;
    case 'date':
      return <input {...common} type="date" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || null)} className={`${inputCls} max-w-56`} />;
    case 'datetime':
      return <input {...common} type="datetime-local" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || null)} className={`${inputCls} max-w-64`} />;
    case 'boolean':
      return (
        <label className="flex items-center gap-2 text-sm">
          <input {...common} type="checkbox" className="size-4.5 accent-brand-700" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          Yes
        </label>
      );
    case 'select':
      return (
        <select {...common} value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value || null)} className={`${inputCls} max-w-md`}>
          <option value="">— Select —</option>
          {field.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case 'relation':
      return <RelationSelect field={field} id={id} value={value} onChange={onChange} />;
    case 'multirelation':
      return <RelationSelect field={field} id={id} value={value} onChange={onChange} multiple />;
    case 'media':
      return <MediaField id={id} value={(value as number) ?? null} onChange={onChange} kind={field.media?.kind} slot={field.media?.slot} />;
    case 'mediaList':
      return <MediaListEditor id={id} value={value} onChange={onChange} field={field} />;
    case 'galleryItems':
      return <MediaListEditor id={id} value={value} onChange={onChange} field={field} withCaptions />;
    case 'indicators':
      return <IndicatorsEditor id={id} value={value} onChange={onChange} />;
    case 'url':
      return <input {...common} type="text" inputMode="url" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} placeholder="https://… or /path" />;
    case 'email':
      return <input {...common} type="email" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
    case 'slug':
      return <input {...common} type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value.toLowerCase())} className={`${inputCls} font-mono`} placeholder="auto-generated" />;
    default:
      return <input {...common} type="text" maxLength={field.max} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
  }
}

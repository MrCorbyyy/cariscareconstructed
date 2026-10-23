'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/features/admin/AdminShell';
import { useAuth } from '@/features/admin/AuthContext';
import { MediaField } from '@/features/admin/MediaPicker';
import { useToast } from '@/features/admin/Toast';
import { ErrorNotice, Panel, Spinner, btn, inputCls, useLoader } from '@/features/admin/ui';
import { admin } from '@/services/admin';
import { ClientApiError } from '@/services/client';

interface Setting {
  key: string;
  label: string;
  group: string;
  type: 'text' | 'textarea' | 'url' | 'email' | 'boolean' | 'media';
  value: string | null;
}

const GROUP_TITLES: Record<string, string> = {
  identity: 'Identity',
  contact: 'Contact details',
  social: 'Social media',
  links: 'External services',
  home: 'Homepage',
  seo: 'Search engine defaults',
  footer: 'Footer',
};

export default function SettingsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useLoader(() => admin.get<Setting[]>('/admin/settings'), []);
  // Unsaved edits layered over the loaded values.
  const [edits, setValues] = useState<Record<string, string>>({});
  const values: Record<string, string> = { ...Object.fromEntries((data ?? []).map((s) => [s.key, s.value ?? ''])), ...edits };
  const [saving, setSaving] = useState(false);
  const editable = can('settings.update');

  const save = async () => {
    if (!data) return;
    const changed = Object.fromEntries(Object.entries(values).filter(([k, v]) => (data.find((s) => s.key === k)?.value ?? '') !== v));
    if (!Object.keys(changed).length) return toast('success', 'No changes to save.');
    setSaving(true);
    try {
      await admin.patch('/admin/settings', changed);
      toast('success', 'Settings saved.');
      setValues({});
      void reload();
    } catch (e) {
      toast('error', e instanceof ClientApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const groups = data ? [...new Set(data.map((s) => s.group))] : [];
  return (
    <>
      <AdminPageHeader
        title="Site settings"
        crumbs={[{ label: 'Site settings' }]}
        description="Contact details, social links, homepage text and defaults used across the website. Enter only verified information."
        actions={editable && <button type="button" onClick={() => void save()} className={btn.primary} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>}
      />
      {error && <ErrorNotice error={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      <fieldset disabled={!editable} className="space-y-6">
        {groups.map((g) => (
          <Panel key={g} title={GROUP_TITLES[g] ?? g}>
            <div className="grid gap-5 md:grid-cols-2">
              {data!
                .filter((s) => s.group === g)
                .map((s) => {
                  const id = `set-${s.key}`;
                  return (
                    <div key={s.key} className={s.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink">
                        {s.label}
                      </label>
                      {s.type === 'textarea' ? (
                        <textarea id={id} rows={3} className={inputCls} value={values[s.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
                      ) : s.type === 'media' ? (
                        <MediaField id={id} value={values[s.key] ? Number(values[s.key]) : null} onChange={(m) => setValues((v) => ({ ...v, [s.key]: m ? String(m) : '' }))} slot="articleFeature" />
                      ) : (
                        <input id={id} type={s.type === 'email' ? 'email' : s.type === 'url' ? 'url' : 'text'} className={inputCls} value={values[s.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
                      )}
                    </div>
                  );
                })}
            </div>
          </Panel>
        ))}
      </fieldset>
    </>
  );
}

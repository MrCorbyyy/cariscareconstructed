'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/features/admin/AdminShell';
import { useAuth } from '@/features/admin/AuthContext';
import { useToast } from '@/features/admin/Toast';
import { Panel, btn, inputCls } from '@/features/admin/ui';
import { adminRequest } from '@/services/admin';
import { ClientApiError } from '@/services/client';

export default function AccountPage() {
  const { session } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next !== confirm) return setError('The new passwords do not match.');
    setBusy(true);
    try {
      await adminRequest('POST', '/auth/change-password', { currentPassword: current, newPassword: next });
      toast('success', 'Password changed. Other sessions have been signed out.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'Could not change password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminPageHeader title="My account" crumbs={[{ label: 'My account' }]} />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Panel title="Profile">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="font-semibold">{session.user.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Roles</dt>
              <dd>{session.roles.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-muted">Session expires</dt>
              <dd>{new Date(session.sessionExpiresAt).toLocaleString('en-GB')}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Change password">
          <form onSubmit={submit} className="space-y-3">
            {[
              ['cur', 'Current password', current, setCurrent, 'current-password'],
              ['new', 'New password', next, setNext, 'new-password'],
              ['conf', 'Confirm new password', confirm, setConfirm, 'new-password'],
            ].map(([id, label, value, setter, ac]) => (
              <div key={id as string}>
                <label htmlFor={`pw-${id}`} className="mb-1 block text-sm font-semibold">
                  {label as string}
                </label>
                <input id={`pw-${id}`} type="password" required autoComplete={ac as string} value={value as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} className={inputCls} />
              </div>
            ))}
            <p className="text-xs text-muted">At least 12 characters, with upper- and lower-case letters and a number.</p>
            <div role="alert">{error && <p className="text-sm font-medium text-danger">{error}</p>}</div>
            <button type="submit" className={btn.primary} disabled={busy}>
              {busy ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Field, TextInput } from '@/components/forms/FormFields';
import { Button } from '@/components/ui/Button';
import { adminRequest } from '@/services/admin';
import { ClientApiError } from '@/services/client';

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setResult({ ok: false, message: 'The passwords do not match.' });
    setBusy(true);
    try {
      await adminRequest('POST', '/auth/reset-password', { token, newPassword: password });
      setResult({ ok: true, message: 'Your password has been reset. You can now sign in.' });
    } catch (err) {
      setResult({ ok: false, message: err instanceof ClientApiError ? err.message : 'Reset failed.' });
    } finally {
      setBusy(false);
    }
  };

  if (result?.ok) {
    return (
      <p className="text-success">
        {result.message}{' '}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <Field id="pw" label="New password" required hint="At least 12 characters, with upper- and lower-case letters and a number.">
        <TextInput id="pw" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} hint="x" />
      </Field>
      <Field id="pw2" label="Confirm new password" required>
        <TextInput id="pw2" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <div role="alert">{result && !result.ok && <p className="text-sm font-medium text-danger">{result.message}</p>}</div>
      <Button type="submit" className="w-full" disabled={busy || !token}>
        {busy ? 'Saving…' : 'Set new password'}
      </Button>
      {!token && <p className="text-sm text-danger">This reset link is incomplete.</p>}
    </form>
  );
}

export default function ResetPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md rounded-(--radius-card) border border-line bg-white p-8 shadow-(--shadow-raised)">
        <h1 className="mb-6 text-2xl font-bold">Reset your password</h1>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}

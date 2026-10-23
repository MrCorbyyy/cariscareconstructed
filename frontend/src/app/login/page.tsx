'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Field, TextInput } from '@/components/forms/FormFields';
import { Button } from '@/components/ui/Button';
import { adminRequest, auth, setCsrfToken } from '@/services/admin';
import { ClientApiError } from '@/services/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [notice, setNotice] = useState('');

  const next = params.get('next');
  const safeNext = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'login') {
        const s = await auth.login(email, password);
        setCsrfToken(s.csrfToken);
        router.replace(safeNext);
      } else {
        const res = await adminRequest<{ data: { message: string } }>('POST', '/auth/forgot-password', { email });
        setNotice(res.data.message);
      }
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field id="email" label="Email address" required>
        <TextInput id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {mode === 'login' && (
        <Field id="password" label="Password" required>
          <TextInput id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
      )}
      <div role="alert" aria-live="assertive">
        {error && <p className="rounded-(--radius-card) bg-[#fdf0ee] px-4 py-3 text-sm font-medium text-danger">{error}</p>}
      </div>
      <div role="status" aria-live="polite">
        {notice && <p className="rounded-(--radius-card) bg-[#eef8f3] px-4 py-3 text-sm font-medium text-success">{notice}</p>}
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={busy || !email || (mode === 'login' && !password)}>
        {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Send reset link'}
      </Button>
      <button type="button" className="link block text-sm" onClick={() => { setMode(mode === 'login' ? 'forgot' : 'login'); setError(''); setNotice(''); }}>
        {mode === 'login' ? 'Forgot your password?' : 'Back to sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-(--radius-card) border border-line bg-white p-8 shadow-(--shadow-raised)">
          <Image src="/brand/carisca-wordmark-navy.png" alt="CARISCA" width={601} height={101} className="h-9 w-auto" preload />
          <h1 className="mt-6 text-2xl font-bold">Website administration</h1>
          <p className="mt-1 mb-6 text-muted">Sign in to manage the CARISCA website.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="link">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}

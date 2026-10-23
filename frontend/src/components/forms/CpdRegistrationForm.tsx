'use client';

import { useId } from 'react';
import { usePublicForm } from '@/hooks/usePublicForm';
import { Button } from '../ui/Button';
import { Checkbox, Field, FormStatus, Honeypot, Select, TextArea, TextInput } from './FormFields';

/** Online registration for a CPD session (only shown when the session accepts it). */
export function CpdRegistrationForm({ sessionId, hybrid }: { sessionId: number; hybrid: boolean }) {
  const id = useId();
  const form = usePublicForm(`/cpd/sessions/${sessionId}/register`, {
    full_name: '',
    email: '',
    phone: '',
    organisation: '',
    job_title: '',
    attendance_mode: '',
    notes: '',
    consent: false,
  });
  const v = form.values;
  const e = form.errors;

  return (
    <form
      noValidate
      className="relative space-y-5"
      onSubmit={(ev) => {
        ev.preventDefault();
        void form.submit({ attendance_mode: v.attendance_mode || undefined });
      }}
    >
      <Honeypot value={form.honeypot} onChange={form.setHoneypot} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Full name" required error={e.full_name}>
          <TextInput id={`${id}-name`} autoComplete="name" required value={v.full_name} error={e.full_name} onChange={(x) => form.set('full_name', x.target.value)} />
        </Field>
        <Field id={`${id}-email`} label="Email" required error={e.email}>
          <TextInput id={`${id}-email`} type="email" autoComplete="email" required value={v.email} error={e.email} onChange={(x) => form.set('email', x.target.value)} />
        </Field>
        <Field id={`${id}-phone`} label="Phone" error={e.phone}>
          <TextInput id={`${id}-phone`} type="tel" autoComplete="tel" value={v.phone} error={e.phone} onChange={(x) => form.set('phone', x.target.value)} />
        </Field>
        <Field id={`${id}-org`} label="Organisation" error={e.organisation}>
          <TextInput id={`${id}-org`} autoComplete="organization" value={v.organisation} error={e.organisation} onChange={(x) => form.set('organisation', x.target.value)} />
        </Field>
        <Field id={`${id}-job`} label="Job title" error={e.job_title}>
          <TextInput id={`${id}-job`} autoComplete="organization-title" value={v.job_title} error={e.job_title} onChange={(x) => form.set('job_title', x.target.value)} />
        </Field>
        {hybrid && (
          <Field id={`${id}-mode`} label="How will you attend?" error={e.attendance_mode}>
            <Select id={`${id}-mode`} value={v.attendance_mode} error={e.attendance_mode} onChange={(x) => form.set('attendance_mode', x.target.value)}>
              <option value="">Select…</option>
              <option value="in_person">In person</option>
              <option value="online">Online</option>
            </Select>
          </Field>
        )}
      </div>
      <Field id={`${id}-notes`} label="Anything we should know?" error={e.notes} hint="Optional — e.g. accessibility needs.">
        <TextArea id={`${id}-notes`} rows={3} className="min-h-24" value={v.notes} error={e.notes} hint="Optional" onChange={(x) => form.set('notes', x.target.value)} />
      </Field>
      <Checkbox
        id={`${id}-consent`}
        checked={Boolean(v.consent)}
        error={e.consent}
        onChange={(x) => form.set('consent', x.target.checked)}
        label="I agree that CARISCA may use these details to process my registration and contact me about this programme."
      />
      <FormStatus status={form.status} />
      <Button type="submit" disabled={form.submitting} size="lg">
        {form.submitting ? 'Submitting…' : 'Register'}
      </Button>
    </form>
  );
}

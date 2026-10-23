'use client';

import { useId } from 'react';
import { usePublicForm } from '@/hooks/usePublicForm';
import { Button } from '../ui/Button';
import { Checkbox, Field, FormStatus, Honeypot, Select, TextArea, TextInput } from './FormFields';

const TOPICS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'research', label: 'Research collaboration' },
  { value: 'training', label: 'Training & CPD' },
  { value: 'partnership', label: 'Partnerships' },
  { value: 'media', label: 'Media enquiry' },
  { value: 'lmi', label: 'Logistics Managers Index' },
];

/**
 * Contact form posting to the API. `interest` turns it into a programme-interest form
 * (e.g. ISCEA certifications) whose choice is stored with the submission.
 */
export function ContactForm({
  topic,
  interest,
  submitLabel = 'Send message',
}: {
  topic?: string;
  interest?: { label: string; options: string[] };
  submitLabel?: string;
}) {
  const id = useId();
  const form = usePublicForm('/contact', {
    name: '',
    email: '',
    phone: '',
    organisation: '',
    subject: '',
    message: '',
    topic: topic ?? 'general',
    interest: '',
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
        const { interest: chosen, ...rest } = v;
        void form.submit({
          ...rest,
          subject: rest.subject || (interest && chosen ? `${interest.label}: ${chosen}` : undefined),
          details: interest && chosen ? { [interest.label]: chosen } : undefined,
        });
      }}
    >
      <Honeypot value={form.honeypot} onChange={form.setHoneypot} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Your name" required error={e.name}>
          <TextInput id={`${id}-name`} autoComplete="name" required value={v.name} error={e.name} onChange={(x) => form.set('name', x.target.value)} />
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
      </div>
      {interest ? (
        <Field id={`${id}-interest`} label={interest.label} error={e.details}>
          <Select id={`${id}-interest`} value={v.interest} onChange={(x) => form.set('interest', x.target.value)}>
            <option value="">Select…</option>
            {interest.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={`${id}-topic`} label="Topic" error={e.topic}>
            <Select id={`${id}-topic`} value={v.topic} onChange={(x) => form.set('topic', x.target.value)}>
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${id}-subject`} label="Subject" error={e.subject}>
            <TextInput id={`${id}-subject`} value={v.subject} error={e.subject} onChange={(x) => form.set('subject', x.target.value)} />
          </Field>
        </div>
      )}
      <Field id={`${id}-message`} label="Message" required error={e.message}>
        <TextArea id={`${id}-message`} required value={v.message} error={e.message} onChange={(x) => form.set('message', x.target.value)} />
      </Field>
      <Checkbox
        id={`${id}-consent`}
        checked={Boolean(v.consent)}
        error={e.consent}
        onChange={(x) => form.set('consent', x.target.checked)}
        label="I agree that CARISCA may store these details to respond to my enquiry."
      />
      <FormStatus status={form.status} />
      <Button type="submit" size="lg" disabled={form.submitting}>
        {form.submitting ? 'Sending…' : submitLabel}
      </Button>
    </form>
  );
}

'use client';

import { notFound, useParams } from 'next/navigation';
import { ResourceForm } from '@/features/admin/ResourceForm';
import { getResource } from '@/features/admin/resources';

/** Edit (numeric id) or create ("new") a record of any configured resource. */
export default function ResourceEditPage() {
  const { resource, id } = useParams<{ resource: string; id: string }>();
  const def = getResource(resource);
  const numericId = id === 'new' ? null : Number(id);
  if (!def || (numericId !== null && !Number.isInteger(numericId))) notFound();
  return <ResourceForm key={`${def.key}-${id}`} def={def} id={numericId} />;
}

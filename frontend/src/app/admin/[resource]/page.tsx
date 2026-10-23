'use client';

import { notFound, useParams } from 'next/navigation';
import { ResourceList } from '@/features/admin/ResourceList';
import { getResource } from '@/features/admin/resources';

export default function ResourceListPage() {
  const { resource } = useParams<{ resource: string }>();
  const def = getResource(resource);
  if (!def) notFound();
  return <ResourceList key={def.key} def={def} />;
}

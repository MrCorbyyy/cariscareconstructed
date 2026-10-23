import { SubscriptionAction } from '@/components/forms/SubscriptionAction';
import { PageHeader } from '@/components/layout/PageHeader';
import { buildMetadata } from '@/lib/seo';

type Props = { searchParams: Promise<{ token?: string }> };

export const metadata = buildMetadata({ title: 'Unsubscribe', path: '/newsletters/unsubscribe', noindex: true });

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <>
      <PageHeader title="Unsubscribe" crumbs={[{ label: 'Newsletter', href: '/newsletters' }, { label: 'Unsubscribe' }]} />
      <div className="container-site py-16">
        <SubscriptionAction action="unsubscribe" token={token} />
      </div>
    </>
  );
}

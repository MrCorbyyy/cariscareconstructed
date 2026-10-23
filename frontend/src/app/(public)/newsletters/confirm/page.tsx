import { SubscriptionAction } from '@/components/forms/SubscriptionAction';
import { PageHeader } from '@/components/layout/PageHeader';
import { buildMetadata } from '@/lib/seo';

type Props = { searchParams: Promise<{ token?: string }> };

export const metadata = buildMetadata({ title: 'Confirm subscription', path: '/newsletters/confirm', noindex: true });

export default async function ConfirmPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <>
      <PageHeader title="Confirm your subscription" crumbs={[{ label: 'Newsletter', href: '/newsletters' }, { label: 'Confirm' }]} />
      <div className="container-site py-16">
        <SubscriptionAction action="confirm" token={token} />
      </div>
    </>
  );
}

import { ClipboardList } from 'lucide-react';
import { LmiChart } from '@/components/charts/LmiChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { FileDownload } from '@/components/ui/FileDownload';
import { EmptyState, RichText, SectionHeading } from '@/components/ui/Typography';
import { buildMetadata } from '@/lib/seo';
import { getLmiReports, getSite, resolvePage } from '@/services/public';

export async function generateMetadata() {
  const r = await resolvePage('/lmi');
  const page = r?.type === 'page' ? r.page : null;
  return buildMetadata({
    title: page?.seo_title || 'Logistics Managers Index (LMI)',
    description: page?.seo_description || page?.summary || 'The Ghana Logistics Managers Index, published quarterly by CARISCA.',
    path: '/lmi',
    image: page?.heroImage,
  });
}

export default async function LmiPage() {
  const [resolved, reports, { settings }] = await Promise.all([resolvePage('/lmi'), getLmiReports(), getSite()]);
  const page = resolved?.type === 'page' ? resolved.page : null;
  const points = reports.map((r) => ({
    label: r.quarter ? `Q${r.quarter} ${r.year}` : String(r.year),
    key: r.year + (r.quarter ?? 0) / 10,
    value: r.lmi_value != null ? Number(r.lmi_value) : null,
    sourceUrl: r.value_source_url,
  }));
  const chronological = [...reports].sort((a, b) => a.year - b.year || (a.quarter ?? 0) - (b.quarter ?? 0));

  return (
    <>
      <PageHeader
        title={page?.title ?? 'Logistics Managers Index (LMI)'}
        eyebrow="Research"
        intro={page?.summary}
        crumbs={[{ label: 'Research', href: '/research' }, { label: 'Logistics Managers Index' }]}
      />
      <div className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <RichText html={page?.body} />

          <section aria-labelledby="trend-heading" className="mt-12">
            <h2 id="trend-heading" className="text-2xl font-bold">
              Ghana LMI by quarter
            </h2>
            {points.filter((p) => p.value != null).length >= 2 ? (
              <div className="mt-5 rounded-(--radius-card) border border-line bg-white p-4 md:p-6">
                <LmiChart points={points} />
              </div>
            ) : (
              <p className="mt-3 text-muted">Index values will be charted here once at least two quarterly values have been entered.</p>
            )}
            <details className="mt-4 rounded-(--radius-card) border border-line bg-surface">
              <summary className="cursor-pointer px-4 py-3 font-display font-semibold text-brand-800">View the data as a table</summary>
              <div className="overflow-x-auto px-4 pb-4">
                <table className="w-full text-left text-[0.95rem]">
                  <caption className="sr-only">Ghana LMI headline values and stated outlook by quarter</caption>
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2 pr-4">Period</th>
                      <th scope="col" className="py-2 pr-4">LMI</th>
                      <th scope="col" className="py-2 pr-4">Future LMI (12-month outlook)</th>
                      <th scope="col" className="py-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chronological.map((r) => (
                      <tr key={r.id} className="border-b border-line last:border-0">
                        <th scope="row" className="py-2 pr-4 font-medium">
                          {r.period_label}
                        </th>
                        <td className="py-2 pr-4">{r.lmi_value != null ? Number(r.lmi_value).toFixed(1) : '—'}</td>
                        <td className="py-2 pr-4">{r.future_lmi_value != null ? Number(r.future_lmi_value).toFixed(1) : '—'}</td>
                        <td className="py-2">
                          {r.value_source_url ? (
                            <a href={r.value_source_url} className="link" target="_blank" rel="noopener noreferrer">
                              Release<span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section aria-labelledby="reports-heading" className="mt-14">
            <SectionHeading id="reports-heading" title="Quarterly reports" />
            {reports.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {reports.map((r) => (
                  <li key={r.id}>
                    {r.file ? (
                      <FileDownload file={r.file} label={`Ghana LMI Report: ${r.period_label}`} />
                    ) : (
                      <div className="rounded-(--radius-card) border border-dashed border-line p-4 text-muted">
                        <p className="font-display font-semibold text-ink">Ghana LMI Report: {r.period_label}</p>
                        <p className="text-sm">Report file not yet available.</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No LMI reports have been published yet." />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {settings.lmi_survey_url && (
            <div className="rounded-(--radius-card) bg-brand-900 p-6 text-white">
              <ClipboardList aria-hidden className="size-8 text-sky-accent" />
              <h2 className="mt-3 text-xl font-bold text-white">Take part in the LMI survey</h2>
              <p className="mt-2 text-brand-100">{settings.lmi_survey_label}</p>
              <p className="mt-2 text-sm text-brand-200">Senior executives and managers of Ghanaian organisations are invited to participate.</p>
              <ButtonLink href={settings.lmi_survey_url} variant="light" className="mt-5 w-full">
                Open the survey
              </ButtonLink>
            </div>
          )}
          <div className="rounded-(--radius-card) border border-line p-5">
            <h2 className="font-display text-lg font-bold">Reading the index</h2>
            <p className="mt-2 text-[0.95rem] text-muted">
              Values above 50 indicate expansion in logistics activity; values below 50 indicate contraction.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

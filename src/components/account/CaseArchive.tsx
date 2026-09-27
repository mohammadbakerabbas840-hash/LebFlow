import { useCallback } from 'react';
import { L, useI18n } from '../../i18n';
import { apiRequest } from '../../services/backend';
import { useResource } from '../../hooks/useResource';
import { getGuide } from '../../data/serviceGuides';
import type { Case } from '../../types/case';
import { ErrorState, LoadingState } from '../common/ResourceState';
export function CaseArchive() {
  const { locale } = useI18n();
  const resource = useResource(useCallback(() => apiRequest<Case[]>('cases-archive'), []));
  return (
    <details className="panel release-panel">
      <summary>
        {L('Archived applications', 'الطلبات المؤرشفة', 'Dossiers archivés')[locale]}
      </summary>
      {resource.loading && <LoadingState />}
      {resource.error && <ErrorState retry={resource.retry} />}
      {resource.data?.length === 0 && (
        <p>
          {
            L('No archived applications.', 'لا توجد طلبات مؤرشفة.', 'Aucun dossier archivé.')[
              locale
            ]
          }
        </p>
      )}
      {resource.data?.map((c) => (
        <article key={c.id}>
          <h3>{getGuide(c.serviceId, locale).title}</h3>
          <p>{locale === 'ar' ? c.applicantNameArabic : c.applicantName}</p>
          <p>
            <bdi>{c.archivedAt?.slice(0, 10)}</bdi>
          </p>
          <ul>
            {getGuide(c.serviceId, locale)
              .documents.filter((d) => c.documents?.includes(d.id))
              .map((d) => (
                <li key={d.id}>{d.title}</li>
              ))}
          </ul>
        </article>
      ))}
    </details>
  );
}

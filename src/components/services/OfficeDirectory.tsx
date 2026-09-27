import { useCallback } from 'react';
import { L, useI18n } from '../../i18n';
import { apiRequest } from '../../services/backend';
import { useResource } from '../../hooks/useResource';
import { ErrorState, LoadingState } from '../common/ResourceState';
type Office = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  hours: string | null;
  accessibility: string | null;
  source_url: string;
  reviewed_at: string;
};
export function OfficeDirectory({ serviceId }: { serviceId: string }) {
  const { locale } = useI18n();
  const text = (en: string, ar: string, fr: string) => L(en, ar, fr)[locale];
  const resource = useResource(
    useCallback(
      () =>
        apiRequest<Office[]>(
          `directory?serviceId=${encodeURIComponent(serviceId)}&locale=${locale}`,
        ),
      [serviceId, locale],
    ),
  );
  return (
    <details className="office-directory">
      <summary>
        {text(
          'Office contacts and access',
          'التواصل مع المكاتب وإمكانية الوصول',
          'Contacts et accessibilité des bureaux',
        )}
      </summary>
      {resource.loading && <LoadingState />}
      {resource.error && <ErrorState retry={resource.retry} />}
      {resource.data?.length === 0 && (
        <p>
          {text(
            'No reviewed contact is listed yet. Use the official source above to confirm your receiving office.',
            'لا توجد بيانات اتصال مراجعة حاليًا. استخدم المصدر الرسمي أعلاه لتحديد المكتب الذي يتسلّم طلبك.',
            'Aucun contact vérifié n’est encore répertorié. Utilisez la source officielle ci-dessus pour confirmer le bureau compétent.',
          )}
        </p>
      )}
      {resource.data?.map((o) => (
        <article key={o.id}>
          <h3>{o.name}</h3>
          <p>{o.address}</p>
          {o.phone && (
            <p>
              <a href={`tel:${o.phone}`}>
                <bdi>{o.phone}</bdi>
              </a>
            </p>
          )}
          <p>
            {o.hours ??
              text(
                'Opening hours: confirm by phone.',
                'أوقات الدوام: أكّدها هاتفيًا.',
                'Horaires : à confirmer par téléphone.',
              )}
          </p>
          <p>
            {o.accessibility ??
              text(
                'Accessibility details have not been verified; call before visiting.',
                'لم يتم التحقّق من تسهيلات الوصول؛ اتصل قبل الزيارة.',
                'L’accessibilité n’a pas été vérifiée ; appelez avant votre visite.',
              )}
          </p>
          <p>
            {text('Source reviewed', 'تاريخ مراجعة المصدر', 'Source consultée le')}:{' '}
            <bdi>{o.reviewed_at}</bdi> ·{' '}
            <a href={o.source_url} target="_blank" rel="noreferrer">
              {text('Official source', 'المصدر الرسمي', 'Source officielle')}
            </a>
          </p>
        </article>
      ))}
    </details>
  );
}

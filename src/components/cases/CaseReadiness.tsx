import { documentsFor, requestStages } from '../../data/serviceGuides';
import type { PersonalRequest } from '../../types/case';
import { useI18n } from '../../i18n';
import { useV1 } from '../../i18n/v1';
export function CaseReadiness({
  serviceId,
  request,
  compact = false,
}: {
  serviceId: string;
  request: PersonalRequest;
  compact?: boolean;
}) {
  const { locale } = useI18n();
  const v = useV1();
  const docs = documentsFor(serviceId, request.kind ?? 'application', locale).filter(
    (d) => !request.notApplicable?.includes(d.id),
  );
  const missing = docs.filter((d) => !request.documents?.includes(d.id));
  const readiness = docs.length
    ? Math.round(((docs.length - missing.length) / docs.length) * 100)
    : 100;
  const timeline = Math.round(
    (Math.max(0, requestStages.indexOf(request.stage ?? requestStages[0])) /
      (requestStages.length - 1)) *
      100,
  );
  return (
    <div className="readiness">
      <p>
        {v('readiness')}: <bdi>{readiness}%</bdi> · {v('timeline')}: <bdi>{timeline}%</bdi>
      </p>
      {!compact && (
        <>
          <progress max={100} value={readiness} aria-label={v('readiness')} />
          <h4>{v('next')}</h4>
          <p>
            {missing.length
              ? v('incompleteNotice')
              : request.stage === 'Completed'
                ? v('allReady')
                : v('continue')}
          </p>
          {missing.length > 0 && (
            <>
              <strong>{v('missing')}</strong>
              <ul>
                {missing.map((d) => (
                  <li key={d.id}>{d.title}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

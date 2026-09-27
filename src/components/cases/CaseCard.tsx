import { CaseReadiness } from './CaseReadiness';
import { ChevronRight, CalendarDays } from 'lucide-react';
import { useI18n } from '../../i18n';
import { formatDocumentProgress, localeTags } from '../../i18n';
import { services } from '../../data/services';
import { documentsFor, getGuide, requestStages } from '../../data/serviceGuides';
import { stageTranslations } from '../../data/serviceContent';
import { beirutNow } from '../../features/cases/caseStorage';
import type { Case } from '../../types/case';
import { CaseProgress } from './CaseProgress';
export function CaseCard({
  request: c,
  mode,
  onSelect: setSelected,
}: {
  request: Case;
  mode: 'cases' | 'appointments' | 'reminders';
  onSelect: (id: string, caseId?: string) => void;
}) {
  const { t, locale } = useI18n();
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(localeTags[locale], { dateStyle: 'long' }).format(
      new Date(`${value}T12:00:00`),
    );
  const s = services.find((s) => s.id === c.serviceId)!;
  const g = getGuide(c.serviceId, locale);
  return (
    <button className="case-card" onClick={() => setSelected(c.serviceId, c.id)}>
      <span className="service-icon">
        <s.icon size={25} />
      </span>
      <div>
        <span className="eyebrow">
          {mode === 'appointments'
            ? t('preferred')
            : mode === 'reminders'
              ? t(c.due < beirutNow().date ? 'overdue' : 'upcoming')
              : stageTranslations[requestStages.indexOf(c.stage ?? requestStages[0])][locale]}
        </span>
        <h3>{g.title}</h3>
        {c.applicantName && <p>{locale === 'ar' ? c.applicantNameArabic : c.applicantName}</p>}
        {mode === 'cases' ? (
          <>
            <p>
              {t(c.kind === 'renewal' ? 'renewal' : 'newApplication')} ·{' '}
              {formatDocumentProgress(
                locale,
                c.documents?.length ?? 0,
                documentsFor(c.serviceId, c.kind ?? 'application').filter(
                  (d) => !c.notApplicable?.includes(d.id),
                ).length,
              )}
            </p>
            <CaseProgress request={c} />
            <CaseReadiness compact serviceId={c.serviceId} request={c} />
            {c.appointment && (
              <p>
                <CalendarDays size={13} /> {formatDate(c.appointment.date)} ·{' '}
                <bdi>{c.appointment.time}</bdi> · {t('preferred')}
              </p>
            )}
          </>
        ) : (
          <p>
            {formatDate(mode === 'appointments' ? c.appointment!.date : c.due)}
            {mode === 'appointments' && (
              <>
                {' '}
                · <bdi>{c.appointment!.time}</bdi>
              </>
            )}
          </p>
        )}
      </div>
      <ChevronRight className="directional" />
    </button>
  );
}

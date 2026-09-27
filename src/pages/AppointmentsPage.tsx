import { ArrowRight, CalendarDays } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Case } from '../types/case';
import type { Page } from '../types/navigation';
import { CaseCard } from '../components/cases/CaseCard';
import { EmptyState } from '../components/common/EmptyState';
export function AppointmentsPage({
  cases: appointments,
  onSelect,
  navigate,
}: {
  cases: Case[];
  onSelect: (id: string) => void;
  navigate: (page: Page) => void;
}) {
  const { t } = useI18n();
  return (
    <section>
      <div className="info-note">
        <CalendarDays size={20} />
        <span>
          {t('noLive')} {t('beirutTime')}
        </span>
      </div>
      {appointments.length ? (
        appointments.map((c) => (
          <CaseCard key={c.id} request={c} mode="appointments" onSelect={onSelect} />
        ))
      ) : (
        <EmptyState
          icon={CalendarDays}
          title={t('noAppointments')}
          description={t('appointmentEmpty')}
        >
          <button className="primary" onClick={() => navigate('explore')}>
            {t('explore')} <ArrowRight size={17} />
          </button>
        </EmptyState>
      )}
    </section>
  );
}

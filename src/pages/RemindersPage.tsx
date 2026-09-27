import { ArrowRight, Bell } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Case } from '../types/case';
import type { Page } from '../types/navigation';
import { CaseCard } from '../components/cases/CaseCard';
import { EmptyState } from '../components/common/EmptyState';
export function RemindersPage({
  cases: reminders,
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
      {reminders.length ? (
        reminders.map((c) => (
          <CaseCard key={c.id} request={c} mode="reminders" onSelect={onSelect} />
        ))
      ) : (
        <EmptyState icon={Bell} title={t('noReminders')} description={t('noRemindersText')}>
          <button className="primary" onClick={() => navigate('cases')}>
            {t('viewCases')} <ArrowRight size={17} />
          </button>
        </EmptyState>
      )}
      <p className="reminder-note">{t('inAppOnly')}</p>
    </section>
  );
}

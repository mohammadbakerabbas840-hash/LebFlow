import { ArrowRight, FolderOpen } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Case } from '../types/case';
import type { Page } from '../types/navigation';
import { CaseCard } from '../components/cases/CaseCard';
import { EmptyState } from '../components/common/EmptyState';
export function CasesPage({
  cases: cases,
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
      {cases.length ? (
        cases.map((c) => <CaseCard key={c.id} request={c} mode="cases" onSelect={onSelect} />)
      ) : (
        <EmptyState icon={FolderOpen} title={t('noCases')} description={t('noCasesText')}>
          <button className="primary" onClick={() => navigate('explore')}>
            {t('explore')} <ArrowRight size={17} />
          </button>
        </EmptyState>
      )}
    </section>
  );
}

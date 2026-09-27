import { useI18n } from '../../i18n';
import { requestStages } from '../../data/serviceGuides';
import type { Case } from '../../types/case';
export function CaseProgress({ request: c }: { request: Case }) {
  const { t } = useI18n();
  return (
    <progress
      value={requestStages.indexOf(c.stage ?? requestStages[0])}
      max={requestStages.length - 1}
      aria-label={t('progress')}
    />
  );
}

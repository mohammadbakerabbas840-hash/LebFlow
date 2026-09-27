import { TreePine } from 'lucide-react';
import { useI18n } from '../../i18n';
export function Footer() {
  const { t } = useI18n();
  return (
    <footer>
      <span>
        <TreePine size={16} />
        {t('clearer')}
      </span>
      <span>{t('independent')}</span>
    </footer>
  );
}

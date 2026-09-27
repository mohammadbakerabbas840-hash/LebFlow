import { Languages } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n';
export function LanguageSwitcher() {
  const { t, locale, setLocale } = useI18n();
  return (
    <label className="language-switch">
      <Languages size={17} />
      <select
        aria-label={t('language')}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        <option value="en">English</option>
        <option value="ar">العربية</option>
        <option value="fr">Français</option>
      </select>
    </label>
  );
}

import { useI18n } from '../../i18n';
import { services } from '../../data/services';
import { getGuide } from '../../data/serviceGuides';
export function ServiceFilters({
  category,
  setCategory,
}: {
  category: string;
  setCategory: (value: string) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="filters">
      <button
        className={category === 'all' ? 'selected' : ''}
        aria-pressed={category === 'all'}
        onClick={() => setCategory('all')}
      >
        {t('all')}
      </button>
      {services
        .filter(
          (s, index) =>
            services.findIndex(
              (other) => getGuide(other.id, 'en').category === getGuide(s.id, 'en').category,
            ) === index,
        )
        .map((s) => (
          <button
            key={s.id}
            className={category === s.id ? 'selected' : ''}
            aria-pressed={category === s.id}
            onClick={() => setCategory(s.id)}
          >
            {getGuide(s.id, locale).category}
          </button>
        ))}
    </div>
  );
}

import { Search, X } from 'lucide-react';
import { useI18n } from '../../i18n';
export function ServiceSearch({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="search-wrap">
      <Search size={20} />
      <input
        aria-label={t('search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
      />
      {query && (
        <button aria-label={t('clear')} onClick={() => setQuery('')}>
          <X size={18} />
        </button>
      )}
    </div>
  );
}

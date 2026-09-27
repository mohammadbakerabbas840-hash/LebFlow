import { getServices } from '../services/client';
import { useResource } from '../hooks/useResource';
import { LoadingState, ErrorState } from '../components/common/ResourceState';
import { ArrowRight, Search, FolderOpen } from 'lucide-react';
import { useI18n } from '../i18n';
import { useState } from 'react';
import { serviceContent } from '../data/serviceContent';
import type { Page } from '../types/navigation';
import { ExploreHero } from '../components/services/ExploreHero';
import { ServiceCard } from '../components/services/ServiceCard';
import { ServiceSearch } from '../components/services/ServiceSearch';
import { ServiceFilters } from '../components/services/ServiceFilters';
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064b-\u065f]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .toLowerCase();
export function ExplorePage({
  onSelect: setSelected,
  navigate,
}: {
  onSelect: (id: string) => void;
  navigate: (page: Page) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const resource = useResource(getServices);
  const filtered = (resource.data ?? []).filter((s) => {
    const g = serviceContent[s.id];
    const searchText = normalize(
      [...Object.values(g.title), ...Object.values(g.subtitle), ...Object.values(g.category)].join(
        ' ',
      ),
    );
    return (
      (category === 'all' || serviceContent[category]?.category.en === g.category.en) &&
      normalize(query)
        .trim()
        .split(/\s+/)
        .every((word) => searchText.includes(word))
    );
  });
  return (
    <>
      <ExploreHero />
      <section id="services" className="services-section">
        <div className="section-heading">
          <div>
            <h2>{t('helpTitle')}</h2>
            <p>{t('helpText')}</p>
          </div>
          <span className="service-count">
            {Object.keys(serviceContent).length} {t('categories')}
          </span>
        </div>
        <ServiceSearch query={query} setQuery={setQuery} />
        <ServiceFilters category={category} setCategory={setCategory} />
        {resource.loading && <LoadingState />}
        {resource.error && <ErrorState retry={resource.retry} />}
        <div className="service-grid">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} onSelect={setSelected} />
          ))}
        </div>
        {!resource.loading && !resource.error && !filtered.length && (
          <div className="empty-state">
            <Search size={28} />
            <h3>{t('noResults')}</h3>
            <p>{t('tryAgain')}</p>
            <button
              className="primary"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
            >
              {t('all')}
            </button>
          </div>
        )}
      </section>
      <section className="save-banner">
        <div className="banner-icon">
          <FolderOpen size={25} />
        </div>
        <div>
          <h3>{t('bannerTitle')}</h3>
          <p>{t('bannerText')}</p>
        </div>
        <button onClick={() => navigate('cases')}>
          {t('viewCases')} <ArrowRight className="directional" size={17} />
        </button>
      </section>
    </>
  );
}

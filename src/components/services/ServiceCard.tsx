import { ArrowUpRight, ArrowRight, CalendarDays } from 'lucide-react';
import { useI18n } from '../../i18n';
import { getGuide } from '../../data/serviceGuides';
import { services } from '../../data/services';
export function ServiceCard({
  service: s,
  onSelect: setSelected,
}: {
  service: (typeof services)[number];
  onSelect: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const g = getGuide(s.id, locale);
  return (
    <button className="service-card" key={s.id} onClick={() => setSelected(s.id)}>
      <div className="card-top">
        <span className={`service-icon icon-${s.id}`}>
          <s.icon size={24} />
        </span>
        {['police', 'passport'].includes(s.id) && <span className="popular">{t('popular')}</span>}
        <ArrowUpRight className="card-arrow" size={19} />
      </div>
      <h3>{g.title}</h3>
      <p>{g.subtitle}</p>
      <div className="card-appointment">
        <CalendarDays size={14} />
        <div>
          <strong>{t('nearest')}</strong>
          <span>{t('unknown')}</span>
        </div>
      </div>
      <div className="card-bottom">
        <span>{g.category}</span>
        <span>
          {t('requirements')} <ArrowRight className="directional" size={14} />
        </span>
      </div>
    </button>
  );
}

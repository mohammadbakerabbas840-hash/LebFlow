import {
  ArrowRight,
  LayoutGrid,
  FolderOpen,
  FileText,
  Check,
  ShieldCheck,
  TreePine,
  Languages,
} from 'lucide-react';
import { useI18n } from '../../i18n';
export function ExploreHero() {
  const { t } = useI18n();
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-kicker">
            <span />
            {t('heroKicker')}
          </span>
          <h2>{t('heroTitle')}</h2>
          <p>{t('heroText')}</p>
          <a href="#services" className="hero-button">
            {t('findService')} <ArrowRight className="directional" size={17} />
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-tag">
            <span>
              <Check size={14} />
            </span>
            {t('clearer')}
          </div>
          <div className="paper-card">
            <div className="paper-top">
              <span>
                <FileText size={23} />
              </span>
              <i>{t('nextChapter')}</i>
            </div>
            <div className="paper-title">{t('sorted')}</div>
            <div className="paper-line" />
            <div className="paper-line short" />
            {(['findService', 'prepare', 'track'] as const).map((key) => (
              <div className="paper-check" key={key}>
                <span>
                  <Check size={12} />
                </span>
                {t(key)}
              </div>
            ))}
            <div className="paper-footer">
              <TreePine size={16} />
              {t('madeFor')}
            </div>
          </div>
          <div className="floating-icon">
            <ShieldCheck size={27} />
          </div>
        </div>
      </section>
      <div className="benefits">
        <span>
          <LayoutGrid />
          {t('together')}
        </span>
        <span>
          <Languages />
          {t('multilingual')}
        </span>
        <span>
          <FolderOpen />
          {t('savedProgress')}
        </span>
      </div>
    </>
  );
}

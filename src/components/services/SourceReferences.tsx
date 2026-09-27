import { ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { ServiceGuide } from '../../types/service';
export function SourceReferences({ guide }: { guide: ServiceGuide }) {
  const { t, locale } = useI18n();
  return (
    <div className="source-note">
      <ShieldCheck size={18} />
      <div>
        <strong>{t('sourceNotes')}</strong>
        <p>{guide.sourceNote}</p>
        <div className="source-links">
          {guide.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.title} ↗
            </a>
          ))}
        </div>
        <p>
          {guide.lastReviewedAt
            ? `${{ en: 'Sources last reviewed', ar: 'آخر مراجعة للمصادر', fr: 'Dernière révision des sources' }[locale]}: ${guide.lastReviewedAt}`
            : t('reviewed')}
        </p>
        <p>{t('requirementsMayChange')}</p>
      </div>
    </div>
  );
}

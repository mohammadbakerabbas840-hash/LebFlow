import { useState } from 'react';
import { L, useI18n } from '../../i18n';
import { useV1 } from '../../i18n/v1';
import { conditionalDocuments, getGuide } from '../../data/serviceGuides';
import { CivilWizard } from './CivilWizard';
import type { RequestKind } from '../../data/serviceGuides';
const questions = {
  authorization: L(
    'Will someone submit the request on your behalf?',
    'هل سيقدّم شخص آخر الطلب نيابةً عنك؟',
    'Une autre personne déposera-t-elle la demande pour vous ?',
  ),
  residence: L(
    'Are you a foreign resident in Lebanon?',
    'هل أنت مقيم أجنبي في لبنان؟',
    'Êtes-vous un résident étranger au Liban ?',
  ),
  employer: L(
    'Is this request being made by an institution?',
    'هل يُقدَّم الطلب من مؤسسة؟',
    'La demande est-elle faite par un organisme ?',
  ),
  translation: L(
    'Do foreign documents or use abroad require translation or prior attestations?',
    'هل تحتاج المستندات الأجنبية أو استخدامها في الخارج إلى ترجمة أو تصديقات مسبقة؟',
    'Les documents étrangers ou leur utilisation à l’étranger nécessitent-ils une traduction ou des attestations préalables ?',
  ),
  property: L(
    'Does your procedure require property documents or legal representation?',
    'هل تتطلّب معاملتك مستندات عقارية أو تفويضاً قانونياً؟',
    'Votre démarche nécessite-t-elle des pièces foncières ou un mandat ?',
  ),
  plans: L(
    'Are you applying for a building permit?',
    'هل تتقدّم بطلب رخصة بناء؟',
    'Demandez-vous un permis de construire ?',
  ),
  planning: L(
    'Do you need planning documents for a building permit?',
    'هل تحتاج إلى إفادة تخطيط لرخصة بناء؟',
    'Avez-vous besoin de documents d’urbanisme pour un permis de construire ?',
  ),
  valuation: L(
    'Does your project require land valuation or additional approvals?',
    'هل يتطلّب مشروعك تخمين الأرض أو موافقات إضافية؟',
    'Votre projet nécessite-t-il une évaluation foncière ou des autorisations supplémentaires ?',
  ),
  qualification: L(
    'Does your profession require qualifications or degree equivalence?',
    'هل تتطلّب مهنتك إثبات المؤهلات أو معادلة الشهادات؟',
    'Votre profession exige-t-elle des qualifications ou une équivalence de diplôme ?',
  ),
  membership: L(
    'Do you already have a professional membership or registration?',
    'هل لديك انتساب أو تسجيل مهني سابق؟',
    'Avez-vous déjà une adhésion ou une inscription professionnelle ?',
  ),
  practice: L(
    'Does your profession require permission to practise?',
    'هل تحتاج مهنتك إلى إذن مزاولة؟',
    'Votre profession nécessite-t-elle une autorisation d’exercice ?',
  ),
};
export function RequirementsWizard({
  serviceId,
  onGenerate,
}: {
  serviceId: string;
  onGenerate: (excluded: string[], kind?: RequestKind) => void;
}) {
  const { locale } = useI18n();
  const v = useV1();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const ids = conditionalDocuments[serviceId].filter((id) => id in questions);
  if (serviceId === 'identity' || serviceId === 'civil')
    return <CivilWizard serviceId={serviceId} onGenerate={onGenerate} />;
  return (
    <section className="passport-wizard generic-wizard">
      <h3>{v('questions')}</h3>
      <p>{v('questionHelp')}</p>
      {serviceId === 'driving' && <p>{v('drivingScope')}</p>}
      <div className="wizard-questions">
        {ids.map((id) => (
          <label key={id}>
            {questions[id as keyof typeof questions][locale]}
            <select
              value={answers[id] ?? 'unsure'}
              onChange={(e) => setAnswers({ ...answers, [id]: e.target.value })}
            >
              {(['unsure', 'applies', 'no'] as const).map((value) => (
                <option key={value} value={value}>
                  {v(value)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p>{getGuide(serviceId, locale).scope}</p>
      <button
        className="primary"
        type="button"
        onClick={() => onGenerate(ids.filter((id) => answers[id] === 'no'))}
      >
        {v('generate')}
      </button>
    </section>
  );
}
